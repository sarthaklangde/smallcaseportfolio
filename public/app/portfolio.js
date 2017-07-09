var myPortfolio = angular.module('myPortfolio',['dndLists','plotly']);

myPortfolio.controller('PortfolioController',['$scope','$http','$location','$window',function($scope,$http,$location,$window){
    $http.get("/data/data.json")
    .then(function(response){
        $scope.maindata = response.data;
        console.log($scope.maindata);
        $scope.portlist = [];
        $scope.networthDate=[{
            date: "111",
            price: "111"
        }];
        $scope.numstocks = 0;
        $scope.peratio = 0;
        $scope.networth = 0;
        $scope.tempnum = new Array(6);
        //Create a total list for pagination
        $scope.totallist = [];
        Object.keys($scope.maindata.price).forEach(function(key) {
            //console.log(key);
            var obj = {};
            obj["name"]=key;
            obj["price"] = $scope.maindata.price[key];
            //console.log(obj);
            $scope.totallist.push(obj);
        });
        console.log("ITEMS QYT",$scope.totallist.length);
        //Now create watchlist
        $scope.pagestart = 0;
        $scope.pageend = 8;
        var totallistcopy = JSON.parse(JSON.stringify($scope.totallist));
        $scope.watchlist = totallistcopy.splice($scope.pagestart,8);
        //console.log(totallistcopy);

        //Parse list of dates to be used everywhere.
        $scope.dateList = []
        for(var i=0; i <$scope.maindata.historical['3M'].point.length;i++){
            $scope.dateList.push($scope.maindata.historical['3M'].point[i].date);
        }
        //console.log($scope.dateList);

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
            $scope.pageend +=8;
            $scope.watchlist = totallistcopy.splice($scope.pagestart,8);
        }
    }


    $scope.dragdroplist = [];//Placeholder list for drag drop

    $scope.addstock = function(stockname,stockprice){
        //console.log("e");

        var object_found = 0;
        for(var i=0; i<$scope.portlist.length;i++){
            if($scope.portlist[i].stockname == stockname){
                $scope.portlist[i].stockqty+=1;
                object_found = 1;
                break;
            }
        }
        if($scope.portlist.length < 6){
            if(object_found == 0){
                $scope.portlist.push({
                    stockname: stockname,
                    stockprice: stockprice,
                    stockqty: 1
                })
            }
        }
        $scope.networthCalc();


        //console.log($scope.portlist);

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
                $scope.portlist.splice(i,1);
                break;
            }
        }
        $scope.networthCalc();
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
        $scope.myChartJson.series[0].values=$scope.networthDate;
        $scope.data[0].y = $scope.networthDate;
        $scope.data[0].x = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

    }

    $scope.addtoportlist=function(stock){
        $scope.addstock(stock.name,stock.price);
    }

    $scope.myChartJson = {
        type: "area",
        plot:{
            aspect: "spline",
            marker:{
                visible: "false"
            }
        },
        labels:[{
            text: "VALUE",
            x: "1%",
            y:"11%",
            "font-size":"12px"
        },{
            text: "TIME",
            x: "80%",
            y:"85%",
            "font-size":"12px"
        }
    ],
    "scale-x":{}, // Creates an interactive legend
    "scale-y":{ guide:{visible:false},       }, // Creates an interactive legend
    series: [  // Insert your series data here.
        { values: []}
    ]
};

$scope.data = [{x: [],
    y: [], type:'scatter',fill: 'tozeroy'}];
    $scope.layout = {
        autosize:false,
        width:380,
        height:255,
        margin: {
            l: 45,
            r: 35,
            b: 20,
            t: 20,
            pad: 5
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
            tickfont: {
                 family: 'proxima_nova_ltsemibold',
                 size: 12,
                 color: '#1D70CA'
               },
           },
        yaxis: {
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
