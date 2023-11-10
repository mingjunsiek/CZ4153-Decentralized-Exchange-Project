import React, { Component } from "react";
import Chart from "react-apexcharts";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
          
        series: [{
            name: "Balance",
            data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
        }],
        options: {
          chart: {
            height: 200,
            type: 'line',
            zoom: {
              enabled: false
            },
            toolbar: {
                show: false
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth',
            width: 1,
          },
          title: {
            text: '',
            align: 'left',
            
          },
          grid: {
            show: false,
            xaxis: {
                lines: {
                    show: false
                },
            },  
            row: {
              colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
              opacity: 0.5
            },
          },
          xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
            labels: {
                show: false
            },
            axisBorder: {
                show: false
            }
          },
          yaxis: {
            labels: {
                show: false
            }
          },
          
        },
        
      
      
      };
  }

  render() {
    return (
      <div className="app">
        <div className="row">
          <div className="mixed-chart">
            <Chart
              options={this.state.options}
              series={this.state.series}
              type="line"
              width="150"
            />
          </div>
        </div>
      </div>
    );
  }
}

export default App;