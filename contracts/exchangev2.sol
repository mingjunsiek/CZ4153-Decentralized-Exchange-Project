pragma solidity >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;
import "./ERC20API.sol";
import "./SafeMath.sol";

// use 6721975 as gas limit

contract exchangev2 {
    using SafeMath for uint256;

    struct Offer {
        uint256 amount;
        address maker;
        uint256 higherPriority;
        uint256 lowerPriority;
    }
    struct OrderBook {
        uint256 higherPrice;
        uint256 lowerPrice;
        mapping(uint256 => Offer) offers;
        uint256 highestPriority;
        uint256 lowestPriority;
        uint256 offerLength;
    }
    struct Token {
        address tokenContract;
        mapping(uint256 => OrderBook) buyBook;
        uint256 maxBuyPrice;
        uint256 minBuyPrice;
        uint256 amountOfBuyPrices;
        mapping(uint256 => OrderBook) sellBook;
        uint256 minSellPrice;
        uint256 maxSellPrice;
        uint256 amountOfSellPrices;
    }

    mapping(address => Token) tokenList;

    mapping(address => uint256) ethBalance;

    mapping(address => string[]) tokenAddressList;

    event BuyMarketResult(
        bool fulfilled,
        bool insufficientEth,
        bool insufficientOrder
    );

    event SellMarketResult(
        bool fulfilled,
        bool insufficientToken,
        bool insufficientOrder
    );

    function retrievePriceInfo(address _tokenAddresses)
        public
        view
        returns (uint256[] memory)
    {
        //minSell, maxSell, totalSellOrder, minBuy, maxBuy, totalBuyOrder
        uint256[] memory tokenInfo = new uint256[](6);
        tokenInfo[0] = tokenList[_tokenAddresses].minSellPrice;
        tokenInfo[1] = tokenList[_tokenAddresses].maxSellPrice;
        tokenInfo[2] = tokenList[_tokenAddresses].amountOfSellPrices;
        tokenInfo[3] = tokenList[_tokenAddresses].minBuyPrice;
        tokenInfo[4] = tokenList[_tokenAddresses].maxBuyPrice;
        tokenInfo[5] = tokenList[_tokenAddresses].amountOfBuyPrices;

        return tokenInfo;
    }

    function buyTokenMarket(
        address _baseToken,
        address _token,
        uint256 _amount
    ) public returns (bool[] memory) {
        Token storage loadedToken = tokenList[_token];
        uint256 remainingAmount = _amount;
        uint256 buyPrice = loadedToken.minSellPrice;
        uint256 ethAmount = 0;
        uint256 offerPointer;
        // fulfilled, insufficient eth, insufficient sell orders
        bool[] memory feedback = new bool[](3);
        feedback[0] = false;
        feedback[1] = false;
        feedback[2] = false;

        ERC20API baseToken = ERC20API(_baseToken);
        ERC20API token = ERC20API(_token);

        while (remainingAmount > 0 && !feedback[1] && !feedback[2]) {
            if (buyPrice == 0) {
                feedback[2] = true;
                break;
            }
            offerPointer = loadedToken.sellBook[buyPrice].highestPriority;
            while (
                offerPointer <= loadedToken.sellBook[buyPrice].lowestPriority &&
                remainingAmount > 0 &&
                !feedback[1]
            ) {
                uint256 volumeAtPointer = loadedToken.sellBook[buyPrice]
                    .offers[offerPointer]
                    .amount;
                if (volumeAtPointer <= remainingAmount) {
                    // if current offer's volume is <= order's volume
                    ethAmount = (volumeAtPointer.mul(buyPrice)).div(1e18);

                    if (
                        (getTokenBalance(msg.sender, _baseToken) >= ethAmount)
                    ) {
                        // approve exchange to move token to maker
                        baseToken.approve(msg.sender, address(this), ethAmount);
                        // send weth to maker
                        baseToken.transferFrom(
                            msg.sender,
                            loadedToken.sellBook[buyPrice].offers[offerPointer]
                                .maker,
                            ethAmount
                        );
                        // send token to taker
                        token.transferFrom(
                            loadedToken.sellBook[buyPrice].offers[offerPointer]
                                .maker,
                            msg.sender,
                            volumeAtPointer
                        );

                        loadedToken.sellBook[buyPrice].offers[offerPointer]
                            .amount = 0;

                        loadedToken.sellBook[buyPrice]
                            .highestPriority = loadedToken.sellBook[buyPrice]
                            .offers[offerPointer]
                            .lowerPriority;

                        remainingAmount = remainingAmount.sub(volumeAtPointer);
                    } else {
                        feedback[1] = true;
                    }
                } else {
                    // if current offer's amount is more than enough
                    if (
                        (loadedToken.sellBook[buyPrice].offers[offerPointer]
                            .amount > remainingAmount)
                    ) {
                        ethAmount = (remainingAmount.mul(buyPrice)).div(1e18);

                        // approve exchange to move token to maker
                        baseToken.approve(msg.sender, address(this), ethAmount);
                        // send weth to maker
                        baseToken.transferFrom(
                            msg.sender,
                            loadedToken.sellBook[buyPrice].offers[offerPointer]
                                .maker,
                            ethAmount
                        );
                        // send token to taker
                        token.transferFrom(
                            loadedToken.sellBook[buyPrice].offers[offerPointer]
                                .maker,
                            msg.sender,
                            remainingAmount
                        );

                        loadedToken.sellBook[buyPrice].offers[offerPointer]
                            .amount = loadedToken.sellBook[buyPrice]
                            .offers[offerPointer]
                            .amount
                            .sub(remainingAmount);

                        remainingAmount = 0;
                    } else {
                        feedback[1] = true;
                    }
                }
                if (
                    !feedback[1] &&
                    offerPointer ==
                    loadedToken.sellBook[buyPrice].lowestPriority &&
                    loadedToken.sellBook[buyPrice].offers[offerPointer]
                        .amount ==
                    0
                ) {
                    loadedToken.amountOfSellPrices = loadedToken
                        .amountOfSellPrices
                        .sub(1);
                    loadedToken.sellBook[buyPrice].offerLength = 0;
                    if (
                        buyPrice == loadedToken.sellBook[buyPrice].higherPrice
                    ) {
                        loadedToken.sellBook[buyPrice].higherPrice = 0;
                        loadedToken.sellBook[buyPrice].lowerPrice = 0;
                        loadedToken.amountOfSellPrices = 0;
                        loadedToken.maxSellPrice = 0;
                        loadedToken.minSellPrice = 0;
                    } else {
                        loadedToken.minSellPrice = loadedToken
                            .sellBook[buyPrice]
                            .higherPrice;
                        loadedToken.sellBook[loadedToken.sellBook[buyPrice]
                            .higherPrice]
                            .lowerPrice = 0;
                    }
                    break;
                }
                offerPointer = loadedToken.sellBook[buyPrice]
                    .offers[offerPointer]
                    .lowerPriority;
            }
            buyPrice = loadedToken.minSellPrice;
        }
        if (remainingAmount == 0) {
            feedback[0] = true;
        }
        emit BuyMarketResult(feedback[0], feedback[1], feedback[2]);
        return feedback;
    }

    function sellTokenMarket(
        address _baseToken,
        address _token,
        uint256 _amount
    ) public returns (bool[] memory) {
        Token storage loadedToken = tokenList[_token];
        // fulfilled, insufficient token, insufficient sell orders
        bool[] memory feedback = new bool[](3);
        feedback[0] = false;
        feedback[1] = false;
        feedback[2] = false;

        uint256 sellPrice = loadedToken.maxBuyPrice;
        uint256 remainingAmount = _amount;
        uint256 offerPointer;
        uint256 ethAmount = 0;

        ERC20API baseToken = ERC20API(_baseToken);
        ERC20API token = ERC20API(_token);

        while (remainingAmount > 0 && !feedback[1] && !feedback[2]) {
            if (sellPrice == 0) {
                feedback[2] = true;
                break;
            }

            offerPointer = loadedToken.buyBook[sellPrice].highestPriority;
            while (
                offerPointer <= loadedToken.buyBook[sellPrice].lowestPriority &&
                remainingAmount > 0 &&
                !feedback[1]
            ) {
                uint256 volumeAtPointer = loadedToken.buyBook[sellPrice]
                    .offers[offerPointer]
                    .amount;
                if ((volumeAtPointer <= remainingAmount)) {
                    // if current offer's volumne is <= order's volume
                    if (
                        (getTokenBalance(msg.sender, _token) >= volumeAtPointer)
                    ) {
                        ethAmount = (volumeAtPointer.mul(sellPrice)).div(1e18);

                        // approve exchange to move token to maker
                        token.approve(
                            msg.sender,
                            address(this),
                            volumeAtPointer
                        );
                        // send token to maker
                        token.transferFrom(
                            msg.sender,
                            loadedToken.buyBook[sellPrice].offers[offerPointer]
                                .maker,
                            volumeAtPointer
                        );
                        // send weth to taker
                        baseToken.transferFrom(
                            loadedToken.buyBook[sellPrice].offers[offerPointer]
                                .maker,
                            msg.sender,
                            ethAmount
                        );

                        loadedToken.buyBook[sellPrice].offers[offerPointer]
                            .amount = 0;

                        loadedToken.buyBook[sellPrice]
                            .highestPriority = loadedToken.buyBook[sellPrice]
                            .offers[offerPointer]
                            .lowerPriority;

                        remainingAmount = remainingAmount.sub(volumeAtPointer);
                    } else {
                        feedback[1] = true;
                    }
                } else {
                    // if current offer's amount is more than enough
                    if (
                        (volumeAtPointer.sub(remainingAmount) > 0) &&
                        (getTokenBalance(msg.sender, _token) >= remainingAmount)
                    ) {
                        ethAmount = (remainingAmount.mul(sellPrice)).div(1e18);

                        // approve exchange to move token to maker
                        token.approve(
                            msg.sender,
                            address(this),
                            remainingAmount
                        );
                        // send token to maker
                        token.transferFrom(
                            msg.sender,
                            loadedToken.buyBook[sellPrice].offers[offerPointer]
                                .maker,
                            remainingAmount
                        );
                        // send weth to taker
                        baseToken.transferFrom(
                            loadedToken.buyBook[sellPrice].offers[offerPointer]
                                .maker,
                            msg.sender,
                            ethAmount
                        );

                        loadedToken.buyBook[sellPrice].offers[offerPointer]
                            .amount = loadedToken.buyBook[sellPrice]
                            .offers[offerPointer]
                            .amount
                            .sub(remainingAmount);

                        remainingAmount = 0;
                    }
                }

                if (
                    !feedback[1] &&
                    offerPointer ==
                    loadedToken.buyBook[sellPrice].lowestPriority &&
                    loadedToken.buyBook[sellPrice].offers[offerPointer]
                        .amount ==
                    0
                ) {
                    loadedToken.amountOfBuyPrices = loadedToken
                        .amountOfBuyPrices
                        .sub(1);
                    loadedToken.buyBook[sellPrice].offerLength = 0;
                    if (loadedToken.buyBook[sellPrice].lowerPrice == 0) {
                        loadedToken.buyBook[sellPrice].higherPrice = 0;
                        loadedToken.buyBook[sellPrice].lowerPrice = 0;
                        loadedToken.amountOfBuyPrices = 0;
                        loadedToken.minBuyPrice = 0;
                        loadedToken.maxBuyPrice = 0;
                    } else {
                        loadedToken.maxBuyPrice = loadedToken.buyBook[sellPrice]
                            .lowerPrice;
                        loadedToken.buyBook[loadedToken.buyBook[sellPrice]
                            .lowerPrice]
                            .higherPrice = loadedToken.maxBuyPrice;
                    }
                    break;
                }
                offerPointer = loadedToken.buyBook[sellPrice]
                    .offers[offerPointer]
                    .lowerPriority;
            }
            sellPrice = loadedToken.maxBuyPrice;
        }
        if (remainingAmount == 0) {
            feedback[0] = true;
        }
        emit SellMarketResult(feedback[0], feedback[1], feedback[2]);
        return feedback;
    }

    function buyTokenLimit(
        address _baseToken,
        address _token,
        uint256 _price,
        uint256 _amount
    ) public {
        Token storage loadedToken = tokenList[_token];

        require(
            getTokenBalance(msg.sender, _baseToken) >=
                ((_price.mul(_amount)).div(1e18)),
            "buyTokenLimit: WETH balance is < Eth required"
        );

        if (
            loadedToken.amountOfSellPrices == 0 ||
            loadedToken.minSellPrice > _price
        ) {
            storeBuyOrder(_token, _price, _amount, msg.sender);
        } else {
            ERC20API baseToken = ERC20API(_baseToken);
            ERC20API token = ERC20API(_token);

            uint256 ethAmount = 0;
            uint256 remainingAmount = _amount;
            uint256 buyPrice = loadedToken.minSellPrice;
            uint256 offerPointer;
            while (buyPrice <= _price && remainingAmount > 0) {
                offerPointer = loadedToken.sellBook[buyPrice].highestPriority;
                while (
                    offerPointer <=
                    loadedToken.sellBook[buyPrice].lowestPriority &&
                    remainingAmount > 0 &&
                    token.balanceOf(
                        loadedToken.sellBook[buyPrice].offers[offerPointer]
                            .maker
                    ) >=
                    loadedToken.sellBook[buyPrice].offers[offerPointer].amount
                ) {
                    uint256 volumeAtPointer = loadedToken.sellBook[buyPrice]
                        .offers[offerPointer]
                        .amount;
                    if (volumeAtPointer <= remainingAmount) {
                        ethAmount = (volumeAtPointer.mul(buyPrice)).div(1e18);
                        require(
                            getTokenBalance(msg.sender, _baseToken) >=
                                ethAmount,
                            "buyTokenLimit: Insufficient eth balance"
                        );

                        // Send weth to maker
                        baseToken.transferFrom(
                            msg.sender,
                            loadedToken.sellBook[buyPrice].offers[offerPointer]
                                .maker,
                            ethAmount
                        );

                        // Send token to taker
                        token.transferFrom(
                            loadedToken.sellBook[buyPrice].offers[offerPointer]
                                .maker,
                            msg.sender,
                            volumeAtPointer
                        );

                        loadedToken.sellBook[buyPrice].offers[offerPointer]
                            .amount = 0;

                        loadedToken.sellBook[buyPrice]
                            .highestPriority = loadedToken.sellBook[buyPrice]
                            .offers[offerPointer]
                            .lowerPriority;
                        remainingAmount = remainingAmount.sub(volumeAtPointer);
                    } else {
                        require(
                            loadedToken.sellBook[buyPrice].offers[offerPointer]
                                .amount > remainingAmount,
                            "buyTokenLimit: Current offer's amount < remaining amount"
                        );
                        ethAmount = (remainingAmount.mul(buyPrice)).div(1e18);

                        // Send Weth to maker
                        baseToken.transferFrom(
                            msg.sender,
                            loadedToken.sellBook[buyPrice].offers[offerPointer]
                                .maker,
                            ethAmount
                        );
                        // Send token to taker
                        token.transferFrom(
                            loadedToken.sellBook[buyPrice].offers[offerPointer]
                                .maker,
                            msg.sender,
                            remainingAmount
                        );

                        loadedToken.sellBook[buyPrice].offers[offerPointer]
                            .amount = loadedToken.sellBook[buyPrice]
                            .offers[offerPointer]
                            .amount
                            .sub(remainingAmount);

                        remainingAmount = 0;
                    }

                    if (
                        offerPointer ==
                        loadedToken.sellBook[buyPrice].lowestPriority &&
                        loadedToken.sellBook[buyPrice].offers[offerPointer]
                            .amount ==
                        0
                    ) {
                        loadedToken.amountOfSellPrices = loadedToken
                            .amountOfSellPrices
                            .sub(1);
                        loadedToken.sellBook[buyPrice].offerLength = 0;
                        if (
                            buyPrice ==
                            loadedToken.sellBook[buyPrice].higherPrice ||
                            loadedToken.sellBook[buyPrice].higherPrice == 0
                        ) {
                            loadedToken.sellBook[buyPrice].higherPrice = 0;
                            loadedToken.sellBook[buyPrice].lowerPrice = 0;
                            loadedToken.amountOfSellPrices = 0;
                            loadedToken.maxSellPrice = 0;
                            loadedToken.minSellPrice = 0;
                        } else {
                            loadedToken.minSellPrice = loadedToken
                                .sellBook[buyPrice]
                                .higherPrice;
                            loadedToken.sellBook[loadedToken.sellBook[buyPrice]
                                .higherPrice]
                                .lowerPrice = 0;
                        }
                        break;
                    }
                    offerPointer = loadedToken.sellBook[buyPrice]
                        .offers[offerPointer]
                        .lowerPriority;
                }
                buyPrice = loadedToken.minSellPrice;
            }
            if (remainingAmount > 0) {
                buyTokenLimit(_baseToken, _token, _price, remainingAmount);
            }
        }
    }

    function sellTokenLimit(
        address _baseToken,
        address _token,
        uint256 _price,
        uint256 _amount
    ) public {
        Token storage loadedToken = tokenList[_token];

        require(
            getTokenBalance(msg.sender, _token) >= _amount,
            "sellTokenLimit: Insufficient Token Balance"
        );

        if (
            loadedToken.amountOfBuyPrices == 0 ||
            loadedToken.maxBuyPrice < _price
        ) {
            storeSellOrder(_token, _price, _amount, msg.sender);
        } else {
            ERC20API baseToken = ERC20API(_baseToken);
            ERC20API token = ERC20API(_token);

            uint256 sellPrice = loadedToken.maxBuyPrice;
            uint256 remainingAmount = _amount;
            uint256 offerPointer;
            while (sellPrice >= _price && remainingAmount > 0) {
                offerPointer = loadedToken.buyBook[sellPrice].highestPriority;
                while (
                    offerPointer <=
                    loadedToken.buyBook[sellPrice].lowestPriority &&
                    remainingAmount > 0 &&
                    baseToken.balanceOf(
                        loadedToken.buyBook[sellPrice].offers[offerPointer]
                            .maker
                    ) >=
                    loadedToken.buyBook[sellPrice].offers[offerPointer].amount
                ) {
                    uint256 volumeAtPointer = loadedToken.buyBook[sellPrice]
                        .offers[offerPointer]
                        .amount;
                    if ((volumeAtPointer <= remainingAmount)) {
                        uint256 ethRequiredNow = (
                            volumeAtPointer.mul(sellPrice)
                        )
                            .div(1e18);
                        require(
                            getTokenBalance(msg.sender, _token) >=
                                volumeAtPointer,
                            "sellTokenLimit: Insufficient Token Balance 2"
                        );

                        // Send token to maker
                        token.transferFrom(
                            msg.sender,
                            loadedToken.buyBook[sellPrice].offers[offerPointer]
                                .maker,
                            volumeAtPointer
                        );

                        loadedToken.buyBook[sellPrice].offers[offerPointer]
                            .amount = 0;

                        // Send weth to taker
                        baseToken.transferFrom(
                            loadedToken.buyBook[sellPrice].offers[offerPointer]
                                .maker,
                            msg.sender,
                            ethRequiredNow
                        );

                        loadedToken.buyBook[sellPrice]
                            .highestPriority = loadedToken.buyBook[sellPrice]
                            .offers[offerPointer]
                            .lowerPriority;
                        remainingAmount = remainingAmount.sub(volumeAtPointer);
                    } else {
                        require(
                            volumeAtPointer.sub(remainingAmount) > 0,
                            "sellTokenLimit: volumeAtPointer is <= remaining amount"
                        );

                        // Send token to maker
                        token.transferFrom(
                            msg.sender,
                            loadedToken.buyBook[sellPrice].offers[offerPointer]
                                .maker,
                            volumeAtPointer
                        );

                        loadedToken.buyBook[sellPrice].offers[offerPointer]
                            .amount = loadedToken.buyBook[sellPrice]
                            .offers[offerPointer]
                            .amount
                            .sub(remainingAmount);

                        // Send weth to taker
                        baseToken.transferFrom(
                            loadedToken.buyBook[sellPrice].offers[offerPointer]
                                .maker,
                            msg.sender,
                            (remainingAmount.mul(sellPrice)).div(1e18)
                        );
                        remainingAmount = 0;
                    }

                    if (
                        offerPointer ==
                        loadedToken.buyBook[sellPrice].lowestPriority &&
                        loadedToken.buyBook[sellPrice].offers[offerPointer]
                            .amount ==
                        0
                    ) {
                        loadedToken.amountOfBuyPrices = loadedToken
                            .amountOfBuyPrices
                            .sub(1);
                        loadedToken.buyBook[sellPrice].offerLength = 0;
                        if (
                            sellPrice ==
                            loadedToken.buyBook[sellPrice].lowerPrice ||
                            loadedToken.buyBook[sellPrice].lowerPrice == 0
                        ) {
                            loadedToken.buyBook[sellPrice].higherPrice = 0;
                            loadedToken.buyBook[sellPrice].lowerPrice = 0;
                            loadedToken.amountOfBuyPrices = 0;
                            loadedToken.minBuyPrice = 0;
                            loadedToken.maxBuyPrice = 0;
                        } else {
                            loadedToken.maxBuyPrice = loadedToken
                                .buyBook[sellPrice]
                                .lowerPrice;
                            loadedToken.buyBook[loadedToken.buyBook[sellPrice]
                                .lowerPrice]
                                .higherPrice = loadedToken.maxBuyPrice;
                        }
                        break;
                    }
                    offerPointer = loadedToken.buyBook[sellPrice]
                        .offers[offerPointer]
                        .lowerPriority;
                }
                sellPrice = loadedToken.maxBuyPrice;
            }
            if (remainingAmount > 0) {
                sellTokenLimit(_baseToken, _token, _price, remainingAmount);
            }
        }
    }

    function storeSellOrder(
        address _token,
        uint256 _price,
        uint256 _amount,
        address _maker
    ) private {
        tokenList[_token].sellBook[_price].offerLength = tokenList[_token]
            .sellBook[_price]
            .offerLength
            .add(1);

        if (tokenList[_token].sellBook[_price].offerLength == 1) {
            tokenList[_token].sellBook[_price].highestPriority = 1;
            tokenList[_token].sellBook[_price].lowestPriority = 1;
            tokenList[_token].amountOfSellPrices = tokenList[_token]
                .amountOfSellPrices
                .add(1);

            tokenList[_token].sellBook[_price].offers[tokenList[_token]
                .sellBook[_price]
                .offerLength] = Offer(_amount, _maker, 0, 1);

            uint256 currentSellPrice = tokenList[_token].minSellPrice;
            uint256 highestSellPrice = tokenList[_token].maxSellPrice;

            if (highestSellPrice == 0 || highestSellPrice < _price) {
                if (currentSellPrice == 0) {
                    tokenList[_token].minSellPrice = _price;
                    tokenList[_token].sellBook[_price].higherPrice = _price;
                    tokenList[_token].sellBook[_price].lowerPrice = 0;
                } else {
                    tokenList[_token].sellBook[highestSellPrice]
                        .higherPrice = _price;
                    tokenList[_token].sellBook[_price]
                        .lowerPrice = highestSellPrice;
                    tokenList[_token].sellBook[_price].higherPrice = _price;
                }
                tokenList[_token].maxSellPrice = _price;
            } else if (currentSellPrice > _price) {
                tokenList[_token].sellBook[currentSellPrice]
                    .lowerPrice = _price;
                tokenList[_token].sellBook[_price]
                    .higherPrice = currentSellPrice;
                tokenList[_token].sellBook[_price].lowerPrice = 0;
                tokenList[_token].minSellPrice = _price;
            } else {
                uint256 sellPrice = tokenList[_token].minSellPrice;
                bool finished = false;
                while (sellPrice > 0 && !finished) {
                    if (
                        sellPrice < _price &&
                        tokenList[_token].sellBook[sellPrice].higherPrice >
                        _price
                    ) {
                        tokenList[_token].sellBook[_price]
                            .lowerPrice = sellPrice;
                        tokenList[_token].sellBook[_price]
                            .higherPrice = tokenList[_token].sellBook[sellPrice]
                            .higherPrice;

                        tokenList[_token].sellBook[tokenList[_token]
                            .sellBook[sellPrice]
                            .higherPrice]
                            .lowerPrice = _price;

                        tokenList[_token].sellBook[sellPrice]
                            .higherPrice = _price;
                        finished = true;
                    }
                    sellPrice = tokenList[_token].sellBook[sellPrice]
                        .higherPrice;
                }
            }
        } else {
            uint256 currentLowest = tokenList[_token].sellBook[_price]
                .lowestPriority
                .add(1);
            tokenList[_token].sellBook[_price].offers[tokenList[_token]
                .sellBook[_price]
                .offerLength] = Offer(
                _amount,
                _maker,
                tokenList[_token].sellBook[_price].lowestPriority,
                currentLowest
            );
            tokenList[_token].sellBook[_price].offers[tokenList[_token]
                .sellBook[_price]
                .lowestPriority]
                .lowerPriority = currentLowest;
            tokenList[_token].sellBook[_price].lowestPriority = currentLowest;
        }
    }

    function storeBuyOrder(
        address _token,
        uint256 _price,
        uint256 _amount,
        address _maker
    ) private {
        tokenList[_token].buyBook[_price].offerLength = tokenList[_token]
            .buyBook[_price]
            .offerLength
            .add(1);

        if (tokenList[_token].buyBook[_price].offerLength == 1) {
            tokenList[_token].buyBook[_price].highestPriority = 1;
            tokenList[_token].buyBook[_price].lowestPriority = 1;
            tokenList[_token].amountOfBuyPrices = tokenList[_token]
                .amountOfBuyPrices
                .add(1);
            tokenList[_token].buyBook[_price].offers[tokenList[_token]
                .buyBook[_price]
                .offerLength] = Offer(_amount, _maker, 0, 1);

            uint256 currentBuyPrice = tokenList[_token].maxBuyPrice;
            uint256 lowestBuyPrice = tokenList[_token].minBuyPrice;

            if (lowestBuyPrice == 0 || lowestBuyPrice > _price) {
                if (currentBuyPrice == 0) {
                    tokenList[_token].maxBuyPrice = _price;
                    tokenList[_token].buyBook[_price].higherPrice = _price;
                    tokenList[_token].buyBook[_price].lowerPrice = 0;
                } else {
                    tokenList[_token].buyBook[lowestBuyPrice]
                        .lowerPrice = _price;
                    tokenList[_token].buyBook[_price]
                        .higherPrice = lowestBuyPrice;
                    tokenList[_token].buyBook[_price].lowerPrice = 0;
                }
                tokenList[_token].minBuyPrice = _price;
            } else if (currentBuyPrice < _price) {
                tokenList[_token].buyBook[currentBuyPrice].higherPrice = _price;
                tokenList[_token].buyBook[_price].higherPrice = _price;
                tokenList[_token].buyBook[_price].lowerPrice = currentBuyPrice;
                tokenList[_token].maxBuyPrice = _price;
            } else {
                uint256 buyPrice = tokenList[_token].maxBuyPrice;
                bool finished = false;
                while (buyPrice > 0 && !finished) {
                    if (
                        buyPrice < _price &&
                        tokenList[_token].buyBook[buyPrice].higherPrice > _price
                    ) {
                        tokenList[_token].buyBook[_price].lowerPrice = buyPrice;
                        tokenList[_token].buyBook[_price]
                            .higherPrice = tokenList[_token].buyBook[buyPrice]
                            .higherPrice;
                        tokenList[_token].buyBook[tokenList[_token]
                            .buyBook[buyPrice]
                            .higherPrice]
                            .lowerPrice = _price;
                        tokenList[_token].buyBook[buyPrice]
                            .higherPrice = _price;
                        finished = true;
                    }
                    buyPrice = tokenList[_token].buyBook[buyPrice].lowerPrice;
                }
            }
        } else {
            uint256 currentLowest = tokenList[_token].buyBook[_price]
                .lowestPriority
                .add(1);
            tokenList[_token].buyBook[_price].offers[currentLowest] = Offer(
                _amount,
                _maker,
                tokenList[_token].buyBook[_price].lowestPriority,
                currentLowest
            );
            tokenList[_token].buyBook[_price].offers[tokenList[_token]
                .buyBook[_price]
                .lowestPriority]
                .lowerPriority = currentLowest;
            tokenList[_token].buyBook[_price].lowestPriority = currentLowest;
        }
    }

    function removeOrder(
        address _baseToken,
        address _token,
        bool isSellOrder,
        uint256 _price
    ) public {
        Token storage loadedToken = tokenList[_token];
        uint256 totalOffers = 0;
        if (isSellOrder) {
            ERC20API token = ERC20API(_token);
            // remove all offers for this price
            uint256 counter = loadedToken.sellBook[_price].highestPriority;
            while (counter <= loadedToken.sellBook[_price].lowestPriority) {
                if (
                    loadedToken.sellBook[_price].offers[counter].maker ==
                    msg.sender
                ) {
                    token.reduceAllowance(
                        msg.sender,
                        address(this),
                        loadedToken.sellBook[_price].offers[counter].amount
                    );
                    totalOffers = totalOffers.add(1);
                    loadedToken.sellBook[_price].offerLength = loadedToken
                        .sellBook[_price]
                        .offerLength
                        .sub(1);

                    if (
                        loadedToken.sellBook[_price].offers[counter]
                            .higherPriority == 0
                    ) {
                        // if this offer is first in queue
                        loadedToken.sellBook[_price]
                            .highestPriority = loadedToken.sellBook[_price]
                            .offers[counter]
                            .lowerPriority;
                        loadedToken.sellBook[_price].offers[loadedToken
                            .sellBook[_price]
                            .offers[counter]
                            .lowerPriority]
                            .higherPriority = 0;
                    } else if (
                        loadedToken.sellBook[_price].offers[counter]
                            .lowerPriority ==
                        loadedToken.sellBook[_price].lowestPriority
                    ) {
                        // if this offer is the last in queue
                        loadedToken.sellBook[_price]
                            .lowestPriority = loadedToken.sellBook[_price]
                            .offers[counter]
                            .higherPriority;
                        loadedToken.sellBook[_price].offers[loadedToken
                            .sellBook[_price]
                            .offers[counter]
                            .higherPriority]
                            .lowerPriority = loadedToken.sellBook[_price]
                            .lowestPriority;
                    } else {
                        //loadedToken.sellBook[_price].offers[counter].amount = 0;
                        // Set lower priority's higherPriority to current higherPriority
                        loadedToken.sellBook[_price].offers[loadedToken
                            .sellBook[_price]
                            .offers[counter]
                            .lowerPriority]
                            .higherPriority = loadedToken.sellBook[_price]
                            .offers[counter]
                            .higherPriority;
                        // Set higher priority's lowerPriority to current lowerPriority
                        loadedToken.sellBook[_price].offers[loadedToken
                            .sellBook[_price]
                            .offers[counter]
                            .higherPriority]
                            .lowerPriority = loadedToken.sellBook[_price]
                            .offers[counter]
                            .lowerPriority;
                    }
                }
                if (counter == loadedToken.sellBook[_price].lowestPriority) {
                    break;
                }
                counter = loadedToken.sellBook[_price].offers[counter]
                    .lowerPriority;
            }

            if (
                loadedToken.sellBook[_price].offerLength == 0 && totalOffers > 0
            ) {
                // if this is the only price left, order book is empty, reset order book
                if (
                    loadedToken.sellBook[_price].lowerPrice == 0 &&
                    loadedToken.sellBook[_price].higherPrice == _price
                ) {
                    // if this is the only price left
                    loadedToken.sellBook[_price].offerLength = 0;
                    loadedToken.sellBook[_price].higherPrice = 0;
                    loadedToken.sellBook[_price].lowerPrice = 0;
                    loadedToken.amountOfSellPrices = 0;
                    loadedToken.minSellPrice = 0;
                    loadedToken.maxSellPrice = 0;
                } else if (loadedToken.sellBook[_price].lowerPrice == 0) {
                    // if this is the first price in order book list
                    loadedToken.sellBook[loadedToken.sellBook[_price]
                        .higherPrice]
                        .lowerPrice = 0;
                    loadedToken.minSellPrice = loadedToken.sellBook[_price]
                        .higherPrice;
                    loadedToken.amountOfSellPrices = loadedToken
                        .amountOfSellPrices
                        .sub(1);
                } else if (loadedToken.sellBook[_price].higherPrice == _price) {
                    // if this is the last price in order book list
                    loadedToken.sellBook[loadedToken.sellBook[_price]
                        .lowerPrice]
                        .higherPrice = loadedToken.sellBook[_price].lowerPrice;
                    loadedToken.maxSellPrice = loadedToken.sellBook[_price]
                        .lowerPrice;
                    loadedToken.amountOfSellPrices = loadedToken
                        .amountOfSellPrices
                        .sub(1);
                } else {
                    // if we are in between order book list
                    loadedToken.sellBook[loadedToken.sellBook[_price]
                        .lowerPrice]
                        .higherPrice = loadedToken.sellBook[_price].higherPrice;
                    loadedToken.sellBook[loadedToken.sellBook[_price]
                        .higherPrice]
                        .lowerPrice = loadedToken.sellBook[_price].lowerPrice;
                    loadedToken.amountOfSellPrices = loadedToken
                        .amountOfSellPrices
                        .sub(1);
                }
            }
        } else {
            ERC20API baseToken = ERC20API(_baseToken);
            uint256 counter = loadedToken.buyBook[_price].highestPriority;
            while (counter <= loadedToken.buyBook[_price].offerLength) {
                if (
                    loadedToken.buyBook[_price].offers[counter].maker ==
                    msg.sender
                ) {
                    baseToken.reduceAllowance(
                        msg.sender,
                        address(this),
                        (
                            (
                                loadedToken.sellBook[_price].offers[counter]
                                    .amount
                                    .mul(_price)
                            )
                                .div(1e18)
                        )
                    );

                    totalOffers = totalOffers.add(1);
                    loadedToken.buyBook[_price].offerLength = loadedToken
                        .buyBook[_price]
                        .offerLength
                        .sub(1);

                    if (
                        loadedToken.buyBook[_price].offers[counter]
                            .higherPriority == 0
                    ) {
                        // if this offer is first in queue
                        loadedToken.buyBook[_price]
                            .highestPriority = loadedToken.buyBook[_price]
                            .offers[counter]
                            .lowerPriority;
                        loadedToken.buyBook[_price].offers[loadedToken
                            .buyBook[_price]
                            .offers[counter]
                            .lowerPriority]
                            .higherPriority = 0;
                    } else if (
                        loadedToken.buyBook[_price].offers[counter]
                            .lowerPriority ==
                        loadedToken.buyBook[_price].lowestPriority
                    ) {
                        // if this offer is last in queue
                        loadedToken.buyBook[_price].lowestPriority = loadedToken
                            .buyBook[_price]
                            .offers[counter]
                            .higherPriority;
                        loadedToken.buyBook[_price].offers[loadedToken
                            .buyBook[_price]
                            .offers[counter]
                            .higherPriority]
                            .lowerPriority = loadedToken.buyBook[_price]
                            .lowestPriority;
                    } else {
                        // if offer is in between offers
                        loadedToken.buyBook[_price].offers[loadedToken
                            .buyBook[_price]
                            .offers[counter]
                            .higherPriority]
                            .lowerPriority = loadedToken.buyBook[_price]
                            .offers[counter]
                            .lowerPriority;
                        loadedToken.buyBook[_price].offers[loadedToken
                            .buyBook[_price]
                            .offers[counter]
                            .lowerPriority]
                            .higherPriority = loadedToken.buyBook[_price]
                            .offers[counter]
                            .higherPriority;
                    }
                }
                if (counter == loadedToken.buyBook[_price].lowestPriority) {
                    break;
                }
                counter = loadedToken.buyBook[_price].offers[counter]
                    .lowerPriority;
            }

            if (
                loadedToken.buyBook[_price].offerLength == 0 && totalOffers > 0
            ) {
                // if no. of offers for this price is 0, this price is empty, remove this order book
                if (
                    loadedToken.buyBook[_price].lowerPrice == 0 &&
                    loadedToken.buyBook[_price].higherPrice == _price
                ) {
                    // if this is the only price left
                    loadedToken.buyBook[_price].offerLength = 0;
                    loadedToken.buyBook[_price].higherPrice = 0;
                    loadedToken.buyBook[_price].lowerPrice = 0;
                    loadedToken.amountOfBuyPrices = 0;
                    loadedToken.minBuyPrice = 0;
                    loadedToken.maxBuyPrice = 0;
                } else if (loadedToken.buyBook[_price].lowerPrice == 0) {
                    // if this is the first price in order book list
                    loadedToken.buyBook[loadedToken.buyBook[_price].higherPrice]
                        .lowerPrice = 0;
                    loadedToken.minBuyPrice = loadedToken.buyBook[_price]
                        .higherPrice;
                    loadedToken.amountOfBuyPrices = loadedToken
                        .amountOfBuyPrices
                        .sub(1);
                } else if (loadedToken.buyBook[_price].higherPrice == _price) {
                    // if this is the last price in order book list
                    loadedToken.buyBook[loadedToken.buyBook[_price].lowerPrice]
                        .higherPrice = loadedToken.buyBook[_price].lowerPrice;
                    loadedToken.maxBuyPrice = loadedToken.buyBook[_price]
                        .lowerPrice;
                    loadedToken.amountOfBuyPrices = loadedToken
                        .amountOfBuyPrices
                        .sub(1);
                } else {
                    // if we are in between order book list
                    loadedToken.buyBook[loadedToken.buyBook[_price].lowerPrice]
                        .higherPrice = loadedToken.buyBook[_price].higherPrice;
                    loadedToken.buyBook[loadedToken.buyBook[_price].higherPrice]
                        .lowerPrice = loadedToken.buyBook[_price].lowerPrice;
                    loadedToken.amountOfBuyPrices = loadedToken
                        .amountOfBuyPrices
                        .sub(1);
                }
            }
        }
    }

    function getUserSellOrders(address _token)
        public
        view
        returns (uint256[] memory, uint256[] memory)
    {
        Token storage loadedToken = tokenList[_token];

        uint256 sellPrice = loadedToken.minSellPrice;
        uint256 counter = 0;
        if (loadedToken.minSellPrice > 0) {
            while (sellPrice <= loadedToken.maxSellPrice) {
                uint256 offerPointer = loadedToken.sellBook[sellPrice]
                    .highestPriority;

                while (
                    offerPointer <= loadedToken.sellBook[sellPrice].offerLength
                ) {
                    if (
                        loadedToken.sellBook[sellPrice].offers[offerPointer]
                            .maker == msg.sender
                    ) {
                        counter = counter.add(1);
                    }
                    offerPointer = offerPointer.add(1);
                }
                if (sellPrice == loadedToken.sellBook[sellPrice].higherPrice) {
                    break;
                } else {
                    sellPrice = loadedToken.sellBook[sellPrice].higherPrice;
                }
            }
        }

        uint256[] memory ordersPrices = new uint256[](counter);
        uint256[] memory ordersVolumes = new uint256[](counter);

        sellPrice = loadedToken.minSellPrice;
        counter = 0;
        bool offered;
        if (loadedToken.minSellPrice > 0) {
            while (sellPrice <= loadedToken.maxSellPrice) {
                offered = false;
                uint256 priceVolume = 0;
                uint256 offerPointer = loadedToken.sellBook[sellPrice]
                    .highestPriority;

                while (
                    offerPointer <= loadedToken.sellBook[sellPrice].offerLength
                ) {
                    if (
                        loadedToken.sellBook[sellPrice].offers[offerPointer]
                            .maker == msg.sender
                    ) {
                        ordersPrices[counter] = sellPrice;
                        priceVolume = priceVolume.add(
                            loadedToken.sellBook[sellPrice].offers[offerPointer]
                                .amount
                        );
                        offered = true;
                    }
                    offerPointer = offerPointer.add(1);
                }
                if (offered) {
                    ordersVolumes[counter] = priceVolume;
                }
                if (sellPrice == loadedToken.sellBook[sellPrice].higherPrice) {
                    break;
                } else {
                    sellPrice = loadedToken.sellBook[sellPrice].higherPrice;
                }
                counter = counter.add(1);
            }
        }
        return (ordersPrices, ordersVolumes);
    }

    function getUserBuyOrders(address _token)
        public
        view
        returns (uint256[] memory, uint256[] memory)
    {
        Token storage loadedToken = tokenList[_token];

        uint256 buyPrice = loadedToken.minBuyPrice;
        uint256 counter = 0;
        if (loadedToken.maxBuyPrice > 0) {
            while (buyPrice <= loadedToken.maxBuyPrice) {
                uint256 offerPointer = loadedToken.buyBook[buyPrice]
                    .highestPriority;

                while (
                    offerPointer <= loadedToken.buyBook[buyPrice].offerLength
                ) {
                    if (
                        loadedToken.buyBook[buyPrice].offers[offerPointer]
                            .maker == msg.sender
                    ) {
                        counter = counter.add(1);
                    }
                    offerPointer = offerPointer.add(1);
                }

                if (buyPrice == loadedToken.buyBook[buyPrice].higherPrice) {
                    break;
                } else {
                    buyPrice = loadedToken.buyBook[buyPrice].higherPrice;
                }
            }
        }

        uint256[] memory ordersPrices = new uint256[](counter);
        uint256[] memory ordersVolumes = new uint256[](counter);

        buyPrice = loadedToken.minBuyPrice;
        counter = 0;
        bool offered;

        if (loadedToken.maxBuyPrice > 0) {
            while (buyPrice <= loadedToken.maxBuyPrice) {
                offered = false;

                uint256 priceVolume = 0;
                uint256 offerPointer = loadedToken.buyBook[buyPrice]
                    .highestPriority;

                while (
                    offerPointer <= loadedToken.buyBook[buyPrice].offerLength
                ) {
                    if (
                        loadedToken.buyBook[buyPrice].offers[offerPointer]
                            .maker == msg.sender
                    ) {
                        ordersPrices[counter] = buyPrice;
                        priceVolume = priceVolume.add(
                            loadedToken.buyBook[buyPrice].offers[offerPointer]
                                .amount
                        );
                        offered = true;
                    }
                    offerPointer = offerPointer.add(1);
                }
                if (offered) {
                    ordersVolumes[counter] = priceVolume;
                }

                if (buyPrice == loadedToken.buyBook[buyPrice].higherPrice) {
                    break;
                } else {
                    buyPrice = loadedToken.buyBook[buyPrice].higherPrice;
                }
                counter = counter.add(1);
            }
        }

        return (ordersPrices, ordersVolumes);
    }

    function getSellOrders(address _token)
        public
        view
        returns (uint256[] memory, uint256[] memory)
    {
        Token storage loadedToken = tokenList[_token];

        uint256 sellPrice = loadedToken.minSellPrice;
        uint256 counter = 0;

        if (loadedToken.minSellPrice > 0) {
            while (sellPrice <= loadedToken.maxSellPrice) {
                uint256 offerPointer = loadedToken.sellBook[sellPrice]
                    .highestPriority;

                while (
                    offerPointer <= loadedToken.sellBook[sellPrice].offerLength
                ) {
                    offerPointer = offerPointer.add(1);
                    counter = counter.add(1);
                }
                if (sellPrice == loadedToken.sellBook[sellPrice].higherPrice) {
                    break;
                } else {
                    sellPrice = loadedToken.sellBook[sellPrice].higherPrice;
                }
            }
        }

        uint256[] memory ordersPrices = new uint256[](counter);
        uint256[] memory ordersVolumes = new uint256[](counter);

        sellPrice = loadedToken.minSellPrice;
        counter = 0;

        if (loadedToken.minSellPrice > 0) {
            while (sellPrice <= loadedToken.maxSellPrice) {
                // uint256 priceVolume = 0;
                uint256 offerPointer = loadedToken.sellBook[sellPrice]
                    .highestPriority;

                while (
                    offerPointer <= loadedToken.sellBook[sellPrice].offerLength
                ) {
                    // priceVolume = priceVolume.add(
                    //     loadedToken.sellBook[sellPrice].offers[offerPointer]
                    //         .amount
                    // );

                    ordersPrices[counter] = sellPrice;
                    ordersVolumes[counter] = loadedToken.sellBook[sellPrice]
                        .offers[offerPointer]
                        .amount;
                    offerPointer = offerPointer.add(1);
                    counter = counter.add(1);
                }
                if (sellPrice == loadedToken.sellBook[sellPrice].higherPrice) {
                    break;
                } else {
                    sellPrice = loadedToken.sellBook[sellPrice].higherPrice;
                }
            }
        }
        return (ordersPrices, ordersVolumes);
    }

    function getBuyOrders(address _token)
        public
        view
        returns (uint256[] memory, uint256[] memory)
    {
        Token storage loadedToken = tokenList[_token];

        uint256 buyPrice = loadedToken.minBuyPrice;
        uint256 counter = 0;

        if (loadedToken.maxBuyPrice > 0) {
            while (buyPrice <= loadedToken.maxBuyPrice) {
                uint256 offerPointer = loadedToken.buyBook[buyPrice]
                    .highestPriority;

                while (
                    offerPointer <= loadedToken.buyBook[buyPrice].offerLength
                ) {
                    counter = counter.add(1);
                    offerPointer = offerPointer.add(1);
                }

                if (buyPrice == loadedToken.buyBook[buyPrice].higherPrice) {
                    break;
                } else {
                    buyPrice = loadedToken.buyBook[buyPrice].higherPrice;
                }
            }
        }
        uint256[] memory ordersPrices = new uint256[](counter);
        uint256[] memory ordersVolumes = new uint256[](counter);

        buyPrice = loadedToken.minBuyPrice;
        counter = 0;

        if (loadedToken.maxBuyPrice > 0) {
            while (buyPrice <= loadedToken.maxBuyPrice) {
                // uint256 priceVolume = 0;
                uint256 offerPointer = loadedToken.buyBook[buyPrice]
                    .highestPriority;

                while (
                    offerPointer <= loadedToken.buyBook[buyPrice].offerLength
                ) {
                    // priceVolume = priceVolume.add(
                    //     loadedToken.buyBook[buyPrice].offers[offerPointer]
                    //         .amount
                    // );

                    ordersPrices[counter] = buyPrice;
                    ordersVolumes[counter] = loadedToken.buyBook[buyPrice]
                        .offers[offerPointer]
                        .amount;

                    counter = counter.add(1);
                    offerPointer = offerPointer.add(1);
                }

                if (buyPrice == loadedToken.buyBook[buyPrice].higherPrice) {
                    break;
                } else {
                    buyPrice = loadedToken.buyBook[buyPrice].higherPrice;
                }
            }
        }

        return (ordersPrices, ordersVolumes);
    }

    function() external payable {
        ethBalance[msg.sender] = ethBalance[msg.sender].add(msg.value);
    }

    function withdrawEth(uint256 _wei) public {
        ethBalance[msg.sender] = ethBalance[msg.sender].sub(_wei);
        msg.sender.transfer(_wei);
    }

    function getTokenBalance(address user, address _tokenAddress)
        public
        view
        returns (uint256)
    {
        ERC20API tokenLoaded = ERC20API(_tokenAddress);
        return tokenLoaded.balanceOf(user);
    }

    function ethToWethSwap(address _address) public payable {
        ERC20API tokenLoaded = ERC20API(_address);
        tokenLoaded.mint.value(msg.value)(msg.sender);
    }

    function wethToEthSwap(address _address, uint256 amt) public {
        ERC20API tokenLoaded = ERC20API(_address);
        tokenLoaded.burn(msg.sender, amt);
    }

    modifier ethRequiredCheck(uint256 _price, uint256 _amount) {
        uint256 ethRequired = _price.mul(_amount);
        require(
            ethRequired >= _amount,
            "buy/sell TokenLimit: Eth required is < than amount"
        );
        require(
            ethRequired >= _price,
            "buy/sell TokenLimit: Eth required is < than price"
        );
        _;
    }
}
