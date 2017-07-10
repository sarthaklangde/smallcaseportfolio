var myPortfolio = angular.module('myPortfolio',['dndLists','plotly']);

myPortfolio.controller('PortfolioController',['$scope','$http','$location','$window',function($scope,$http,$location,$window){
    $http.get("/data/data.json")
    .then(function(response){

        $scope.maindata = response.data;

        $scope.portlist = [];
        $scope.numstocks = 0;
        $scope.peratio = 0;
        $scope.networth = 0;
        $scope.tempnum = new Array(6);

        //Lets initialize some conditions
        //Create a total list for pagination
        $scope.totallist = [];
        Object.keys($scope.maindata.price).forEach(function(key) {
            var obj = {};
            obj["name"]=key;
            obj["price"] = $scope.maindata.price[key];
            $scope.totallist.push(obj);
        });

        //Now create watchlist
        $scope.pagestart = 0;
        $scope.pageend = 8;
        var totallistcopy = JSON.parse(JSON.stringify($scope.totallist));
        $scope.watchlist = totallistcopy.splice($scope.pagestart,8);

        //Parse list of dates to be used wherever wanted.
        $scope.dateList = []
        for(var i=0; i <$scope.maindata.historical['3M'].point.length;i++){
            $scope.dateList.push($scope.maindata.historical['3M'].point[i].date);
        }

    });

    $scope.pagenext = function(){
        if($scope.pagestart + 8 < $scope.totallist.length){
            $scope.pagestart+=8;//Allow going to next page
            $scope.watchlistupdate();
        }

    }

    $scope.pageback = function(){
        if($scope.pagestart>0){
            $scope.pagestart-=8;
            $scope.watchlistupdate();
        }

    }

    $scope.decrementqty = function(stockname){
        for(var i=0; i<$scope.portlist.length;i++){
            if($scope.portlist[i].stockname == stockname){
                if($scope.portlist[i].stockqty>1){
                    $scope.portlist[i].stockqty-=1;
                    break;
                }else{
                    break;
                }

            }
        }
        $scope.networthCalc();
    }
    $scope.incrementqty = function(stockname){
        for(var i=0; i<$scope.portlist.length;i++){
            if($scope.portlist[i].stockname == stockname){
                $scope.portlist[i].stockqty+=1;
                break;
            }
        }
        $scope.networthCalc();
    }

    $scope.watchlistupdate = function(){


        var totallistcopy = JSON.parse(JSON.stringify($scope.totallist));
        var remainstocks = $scope.totallist.length - $scope.pagestart;
        if(remainstocks<8){
            $scope.pageend = $scope.totallist.length;
            $scope.watchlist = totallistcopy.splice($scope.pagestart,remainstocks);
        }
        else{
            $scope.pageend =$scope.pagestart+8;
            $scope.watchlist = totallistcopy.splice($scope.pagestart,8);
        }
        if($scope.watchlist.length==0){
            $scope.pageback();
        }
        console.log("Watchlist length:",$scope.watchlist);
    }


    $scope.dragdroplist = [];//Placeholder list for drag drop

    $scope.addstock = function(stockname,stockprice){
        if($scope.portlist.length < 6){

            $scope.portlist.push({
                stockname: stockname,
                stockprice: stockprice,
                stockqty: 1
            });

            for(var i=0;i<$scope.totallist.length;i++){
                if($scope.totallist[i].name == stockname){
                    $scope.totallist.splice(i,1);
                    console.log("New totlist",$scope.totallist);
                    break;
                }
            }

        }

        $scope.watchlistupdate();
        $scope.networthCalc();
        console.log($scope.portlist);

    };

    $scope.editportlist= function(stockname,stockqty){
        for(var i=0; i<$scope.portlist.length;i++){
            if($scope.portlist[i].stockname == stockname){
                $scope.portlist[i].stockqty=stockqty;
                break;
            }
        }
        $scope.networthCalc();
    };

    $scope.removestock = function(stockname){
        for(var i=0;i<$scope.portlist.length;i++){
            if($scope.portlist[i].stockname == stockname){
                $scope.totallist.push({
                    name:$scope.portlist[i].stockname,
                    price:$scope.portlist[i].stockprice
                });
                $scope.portlist.splice(i,1);
                break;
            }
        }
        $scope.watchlistupdate();
        $scope.networthCalc();
        console.log("totallist print",$scope.totallist);
    }

    $scope.networthCalc = function(){
        $scope.numstocks = $scope.portlist.length;
        sum = 0;
        for(var i=0;i<$scope.portlist.length;i++){
            sum+=$scope.portlist[i].stockprice * $scope.portlist[i].stockqty;
        }
        $scope.networth = sum;
        $scope.weightageCalc();
        $scope.peCalc();
        $scope.graphCalc();
    }

    $scope.weightageCalc = function(){
        //console.log("Hello");
        for(var i=0;i<$scope.portlist.length;i++){
            $scope.portlist[i].weightage=($scope.portlist[i].stockprice * $scope.portlist[i].stockqty)/$scope.networth;
        }
        //console.log($scope.portlist);
    }


    $scope.peCalc = function(){
        var sum=0;
        for(var i=0;i<$scope.portlist.length;i++){
            var stockname = $scope.portlist[i].stockname.toString();
            sum+=$scope.portlist[i].stockqty * parseInt($scope.maindata.eps[stockname]);
        }
        $scope.peratio = $scope.networth/sum;
    }


    $scope.graphCalc = function(){
        $scope.networthDate = [];
        for(var j=0;j<$scope.dateList.length;j++){
            var sum = 0;
            for(var i=0;i<$scope.portlist.length;i++){
                var stockname = $scope.portlist[i].stockname;
                sum+=($scope.maindata.historical[stockname].point[j].price * $scope.portlist[i].stockqty);
            }
            $scope.networthDate.push(sum);

        }
        $scope.data[0].y = $scope.networthDate;

    }

    $scope.addtoportlist=function(stock){
        console.log("Drag Drop List : ",$scope.dragdroplist);
        $scope.addstock(stock.name,stock.price);
    }

// Plot.ly config

    $scope.data = [{

        type:'scatter',
        fill: 'tozeroy',
        fillcolor:'#82AFE4 ',
        mode:'lines',
        line: {
            color: '#1D70CA',
            width: 1
          }
        }];
        $scope.layout = {
            autosize:false,
            width:380,
            height:255,
            margin: {
                l: 45,
                r: 35,
                b: 20,
                t: 20,
                pad: 0
            },
            annotations: [{
                xref: 'paper',
                yref: 'paper',
                x: 0,
                xanchor: 'right',
                y: 1,
                yanchor: 'bottom',
                text: 'VALUE',
                font: {
                    family: 'proxima_nova_ltsemibold',
                    size: 12,
                    color: '#1D70CA '
                 },
                showarrow: false
              }, {
                xref: 'paper',
                yref: 'paper',
                x: 1,
                xanchor: 'left',
                y: 0,
                yanchor: 'top',
                text: 'TIME',
                font: {
                    family: 'proxima_nova_ltsemibold',
                    size: 12,
                    color: '#1D70CA '
                 },
                showarrow: false
            }],
            xaxis: {
                zeroline:false,
                autotick:true,
                linecolor: '#1D70CA',
                linewidth: 2,
                tickfont: {
                     family: 'proxima_nova_ltsemibold',
                     size: 12,
                     color: '#1D70CA'
                   },

               },
            yaxis: {
                zeroline:false,
                autotick:true,
                linecolor: '#1D70CA',
                linewidth: 2,
                tickfont: {
                     family: 'proxima_nova_ltsemibold',
                     size: 12,
                     color: '#1D70CA'
                   },
               },
        };
        $scope.options = {showLink: false, displayLogo: false};

        $scope.toggleEvent=function(){
            if($scope.dragEvent == true){
                $scope.dragEvent = false;
            }
            else{
                $scope.dragEvent = true;
            }
        }



    }]);
