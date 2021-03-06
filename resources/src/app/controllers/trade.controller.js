(function() {

  'use strict';
  var controllers = angular.module('AppControllers');

  controllers.controller('TradeController',
      function($scope,$timeout, StockUtils,config,TradeService,stocksFilter,LxNotificationService,ChartService) {

        $scope.isLive = true;

        $timeout(function(){
            $scope.isLoading = true;
        },100000);

        var checkTime = function(){
             var now = new moment();
             if(now.day()===6||now.day()===0){ //sat or sun. Need to figure out public holiday check!!!
                 $scope.isLive = false;
                 return;
             }
             var start = (new moment()).hour(9).minute(15);
             var end = (new moment()).hour(15).minute(30);
             if(now.isAfter(start) && now.isBefore(end)){
                 $scope.isLive = true;
                 return;
             }
             $scope.isLive = false;
        };
        checkTime();

        $scope.total = 0;

        $scope.state = {}; // inputs

        StockUtils.keepOnUpdating(function(data){
            console.log(data);
            $scope.stocks = data;
            if($scope.selectedTradeOption){
				$scope.filteredStocks = stocksFilter($scope.stocks,$scope.selectedTradeOption.option);
			}
        });

        $scope.$on('$destroy', function() {
            StockUtils.cancel(); //kill the timer.
        });

        $scope.options = [{
          option: config.buy
        },{
          option: config.sell
        },{
          option: config.short_sell
        },{
          option: config.cover
        }];

        $scope.typeChange = function(){
            console.log('Type Change');
            $scope.noStocks = true;
            $scope.selectedStock = null;
            $scope.filteredStocks = stocksFilter($scope.stocks,$scope.selectedTradeOption.option);
            console.log($scope.filteredStocks);
        };

        $scope.changeStock = function(){

           if(!$scope.selectedStock) return;
           switch($scope.selectedTradeOption.option){
                case config.buy: $scope.maxAmount = $scope.selectedStock.max_buy;
                            break;
                case config.short_sell :$scope.maxAmount = $scope.selectedStock.max_short;
                             break;
                case config.cover :$scope.maxAmount = $scope.selectedStock.shorted_amount;
                              break;
                case config.sell : $scope.maxAmount = $scope.selectedStock.bought_amount;
                              break;
                default:
                    console.log($scope.transationType+"error");
                break;
            }
          $scope.value = $scope.selectedStock.value;
          if($scope.tAmount)
              $scope.tAmount= 0;
        };

        $scope.$watch('state.tAmount', function(){

            if($scope.state.tAmount> $scope.maxAmount){
                $scope.state.tAmount = $scope.maxAmount;
            }

            if(!$scope.selectedStock) return;
            $scope.total = $scope.state.tAmount * $scope.selectedStock.value;
            $scope.total = $scope.total ? $scope.total : 0;

        });

        var reset = function(){
            $scope.typeChange();
        };
        $scope.isLoading = false;
        $scope.doTrade = function(){
            $scope.isLoading = true;
            var data = {
                type : $scope.selectedTradeOption.option,
                symbol : $scope.selectedStock.symbol,
                amount : $scope.state.tAmount
            };

            console.log(data);

            TradeService.trade(data,function(response){
                console.log(response);
                $scope.isLoading = false;
                $scope.stocks = response;
                $scope.filteredStocks = stocksFilter($scope.stocks,$scope.selectedTradeOption.option);
                loadChart();
                LxNotificationService.alert('Success',
                 'Transaction has been done successfully.', 'Ok', function(answer){

                });
                reset();
            },function(err){
                console.log(err);
                $scope.isLoading = false;
                //error logic here.
                LxNotificationService.alert('Sorry.',
                 'Unknown error occured.', 'Ok', function(answer){

                });
                reset();
            });
        };

        $scope.chartOptions = {
            /*segmentShowStroke: false,*/
            segmentStrokeWidth: 0,
            segmentStrokeColor: 'rgba(255,255,255,.2)',
            animation:{
                duration: 2500
            }
        };
        $scope.colors = config.pieColors;
        var loadChart = function(){
            ChartService.stats({type:'trade'},function(response){
               $scope.labels = response.types;
               $scope.piedata = response.data;
               $scope.chartDataLoaded = true;
            },function(err) {
                console.log(err);
            });
        };
        loadChart();

  });



})();
