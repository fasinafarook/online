const orderCounts = JSON.parse(document.getElementById('myChart').getAttribute('data-monthly-order-counts'));
const yearlyData = JSON.parse(document.getElementById('myChart').getAttribute('data-yearly-order-counts'));

(function ($) {
    "use strict";

    console.log('orderCounts:', orderCounts);
    console.log('yearlyData:', yearlyData);

    let chartData = {
        labels: [],
        datasets: [{
            label: 'Products',
            tension: 0.3,
            fill: true,
            backgroundColor: 'rgba(44, 120, 220, 0.2)',
            borderColor: 'rgba(44, 120, 220)',
            data: yearlyData // Assuming yearlyData contains the yearly order counts
        }]
    };

    /* Sale statistics Chart */
    if ($('#myChart').length) {
        var ctx = document.getElementById('myChart').getContext('2d');
        var chart = new Chart(ctx, {
            // The type of chart we want to create
            type: 'line',
            
            // The data for our dataset
            data: chartData,
            options: {
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        },
                    }
                }
            }
        });

        // Event listener for yearly button
        $('#yearlyButton').on('click', function() {
            console.log('Switching to yearly data');
            chart.data.labels = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028'];
            chart.data.datasets[0].data = yearlyData;
            chart.update();
        });

        // Event listener for monthly button
        $('#monthlyButton').on('click', function() {
            console.log('Switching to monthly data');
            chart.data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            chart.data.datasets[0].data = orderCounts;
            chart.update();
        });
    } 
    
})(jQuery);
