var app = angular.module("myApp",['ui.router','ngMaterial','ngCookies']);


document.addEventListener('DOMContentLoaded', function () { // for notifications
    if (!Notification) {
        alert('Desktop notifications not available in your browser. Try Chrome.');
        return;
    }

    if (Notification.permission !== "granted")
        Notification.requestPermission();
});

app.config(function($mdThemingProvider,$mdIconProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('blue')
    .accentPalette('pink');
});

app.run(function ($rootScope,$timeout) {
    $rootScope.$on('$viewContentLoaded', ()=> {
      $timeout(() => {
        componentHandler.upgradeAllRegistered();
      })
    })
}); // register mdl elemenets


// var socket= io.connect("http://protected-sierra-93361.herokuapp.com");
var socket= io.connect("http://localhost:3000");


app.controller("loginCtrl",($scope,$state,$cookieStore)=>{

    if($cookieStore.get('kbLogged'))
    {
        $state.go('home.inbox');
    }

    $scope.showlogin = true;
    $scope.showsignup = false;

    $scope.register = (email,pass,code)=>{
        console.log(email + pass);
        if(code != "123abc"){
            alert("Invalid Registration key");
        }else{
            console.log("Signup");
            socket.emit("registerUser",email,pass);
        }
    };

    $scope.resetPassword = (email)=>{
        socket.emit("resetPassword",email);
    };

    // socket.on("errorMsg",(err)=>{
    //     alert(err);
    // });




    $scope.login = (email,pass)=>{
        console.log(email + pass);
        socket.emit("loginUser",email,pass);
    };

    socket.on("registersuccess",()=>{
        location.reload();
        alert("Registered successfully!");
    });

    socket.on("resetSuccessful",(mess)=>{
        alert(mess);
        location.reload();
    });

    socket.on("redirectToInbox",(user)=>{
        $state.go('home.inbox');

        $cookieStore.put('kbLogged',true);
        // $cookieStore.put('myFavorite',"emily")
        // $cookieStore.remove('myFavorite');
        // console.log($cookieStore.get('myFavorite'));
    });

    socket.on("redirectToLogin",(user)=>{
        $state.go('login');

        // window.location = "http://localhost/#!/login";
        // window.location.reload();
    });

});

app.controller("historyCtrl",($scope,inqService,userService)=>{

    $scope.orderByField = 'time';
    $scope.reverseSort = false;

    $scope.$watch(function() {
        return inqService.getInq();
    }, function() {
        $scope.getInq();
    });

    $scope.$watch(function() {
        return userService.getUsers();
    }, function() {
        $scope.updateUsers();
    });

    $scope.users = {};


    $scope.updateUsers = ()=>{
        $scope.users = userService.getUsers();
    };


    $scope.openInq = (ID)=>{
        window.open("http://protected-sierra-93361.herokuapp.com/#!/home/inbox/chat/"+ID);
    }
    $scope.getInq = ()=>{
        $scope.allInq = inqService.getInq();

        $scope.payments = [];

        if(Object.keys($scope.allInq).length>0){
            // console.log($scope.allInq['-Kjs3Aj_BfMqilAUcgpc'].inquiryID);

            for(k in $scope.allInq){

                if($scope.allInq[k].quotations != undefined && $scope.users[$scope.allInq[k].inquiryOwner]!=undefined){
                    for(var i =0; i< $scope.allInq[k].quotations.length; i++){
                        if($scope.allInq[k].quotations[i].payment!=undefined)
                        {
                            $scope.toAdd = $scope.allInq[k].quotations[i].payment;
                            $scope.toAdd.time = $scope.allInq[k].quotations[i].payment.paymentDate;

                            // console.log(new Date($scope.allInq[k].quotations[i].payment.paymentDate));
                            $scope.toAdd.inquiryID = $scope.allInq[k].inquiryID;
                            $scope.toAdd.inquiryName = $scope.allInq[k].inquiryName;
                            $scope.toAdd.customer = $scope.users[$scope.allInq[k].inquiryOwner].name;
                            $scope.toAdd.customerID = $scope.allInq[k].inquiryOwner;
                            $scope.toAdd.quote = $scope.allInq[k].quotations[i];
                            $scope.toAdd.quoteNumber = i + 1;

                            $scope.payments.push($scope.toAdd);
                        }
                    }
                }

            }

            console.log($scope.payments);
        }
    };

});

app.controller("chatCtrl",($scope, $stateParams, messageService,$state,inqService,userService,$cookieStore)=>{

    if($cookieStore.get('kbLogged'))
    {
        $state.go('home.inbox');
    }else{
        socket.emit("getUser");
    }


    $scope.view = ()=>{
        $('.image').viewer();
    };

    socket.emit("retrieveInfo");

    socket.on("redirectToLogin1",()=>{


        $state.go('login');
        // window.location = "http://localhost/#!/home/inbox";

        // window.location = "http://localhost:3000/#!/login";
        window.location.reload();
    });

    $scope.logout = ()=>{
        $cookieStore.remove('kbLogged');
        socket.emit("logoutUser");
    };

    $scope.rname = '';
    $scope.inputMessage = '';
    $scope.hideSend = true;
    $scope.hideRoom = true;
    $scope.allInquiryList = [];

    $scope.messages = [];

    $scope.hideName = true;
    $scope.hideRoom = false;

    socket.on("loadMessage",(msg)=>{
        var message = msg;
        messageService.addMessage(message);
        $scope.$apply();

    });

    socket.on("recieveMessage",(msg)=>{
        console.log('recieving message');
        console.log(msg);
        var message = {};
        var message = msg;

        $scope.notificationtitle = $scope.allInquiryList[msg.inquiryID].inquiryName;

        messageService.addMessage(message);
        $scope.$apply();

        $(document).ready(function(){
        $('#convo').animate({
            scrollTop: $('#convo')[0].scrollHeight}, 0);
        });

        // console.log(message);

        if(message.messageUser!= 'admin'){
            if (Notification.permission !== "granted")
                Notification.requestPermission();
            else {
                var notification = new Notification($scope.notificationtitle, {
                    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd0XHy-MpwWSHpn4RbwC8dKSWeabXTe3jf6uIZGldY26367BPL',
                    body: message.messageText,
                });

                if(message.messageType== "payment"){
                    notification.onclick = function () {
                        window.open("http://protected-sierra-93361.herokuapp.com/#!/home/history");
                        // window.open("http://localhost/#!/home/inbox/chat/"+ID);
                    };
                }else{
                    notification.onclick = function () {
                        window.open("http://protected-sierra-93361.herokuapp.com/#!/home/inbox/chat/"+msg.inquiryID.trim());
                        // window.open("http://localhost/#!/home/inbox/chat/"+ID);
                    };
                }

            }
        }

    });

    socket.on("updateUserList",(userList)=>{
        // $scope.allInquiryList = inquiryList;
        // console.log(userList);

        userService.addUsers(userList);
        $scope.$apply();

    });

    socket.on("updateInquiryList",(inquiryList)=>{
        $scope.allInquiryList = inquiryList;

        inqService.addInq(inquiryList);
        $scope.$apply();

        console.log('updating inqs');
    });

    $scope.updateRead = (inq)=>{
        // console.log(inq);
        socket.emit("updateLastRead",inq);
    };


});

app.controller("chatBoxCtrl",($scope,$stateParams,messageService,inqService,userService)=>{

    $scope.chatID = $stateParams.id; //get chat id
    $scope.messages = messageService.getMessage(); //get messages

    $scope.all = {};

    // $scope.allInq = inqService.getInq();

    $scope.$watch(function() {
        return userService.getUsers();
    }, function() {
        $scope.updateUsers();
    });

    $scope.users = {};


    $scope.updateUsers = ()=>{
        $scope.users = userService.getUsers();
    };


    $scope.$watch(function() {
        return inqService.getInq();
    }, function(newContacts) {
        // Do something with newContacts.
        // console.log('aaaa');
        $scope.getInq();
    });

    $scope.currentInq = {};
    $scope.bearing1= [];
    $scope.allInq = {};
    // $scope.currentInq1 = {};


    $scope.addRow = ()=>{
        $scope.currentInq.bearings.push({});

        console.log($scope.currentInq);
        console.log($scope.currentInq1);
        $scope.bearing1.push('');
    };

    $scope.removeRow= (index)=>{
        if(index>-1)
        {
            $scope.currentInq.bearings.splice(index,1);
            $scope.ppu.splice(index,1);
            $scope.quantity.splice(index,1);
            // $scope.total.splice(index,1);

            $scope.bearing.splice(index,1);

            // console.log($scope.total);
            $scope.getTotal();
        }
    };

    $scope.getInq = ()=>{
        $scope.allInq = inqService.getInq();

        $scope.currentInq = angular.copy($scope.allInq[$scope.chatID]);

        if($scope.currentInq1 == undefined)
        {
            $scope.currentInq1 = angular.copy($scope.currentInq);
        }



        if($scope.currentInq!=undefined)
        {
            for(var i=0;i<$scope.currentInq['bearings'].length;i++ ){
                $scope.bearing1.push($scope.currentInq['bearings'][i].serialNo);
            }
            $scope.currentUser = $scope.users[$scope.currentInq.inquiryOwner];

        }




        // console.log($scope.bearing1);
    };

    // inqService.registerObserverCallback($scope.getInq);

    $scope.updateBearings = (index,serial)=>{
        $scope.bearing1[index] = serial;
    };

    $scope.ppu = [];
    $scope.quantity = [];
    $scope.total = [];
    $scope.bearing= [];
    $scope.gTotal = 0;

    $scope.getTotal = ()=>{
        var l = $scope.ppu.length;
        console.log('length is' + l);
        var total = 0;
        for(var i =0; i<l; i++)
        {
            // console.log($scope.ppu[i] +"*"+ $scope.quantity[i])
            total = total + ($scope.ppu[i] * $scope.quantity[i]);
        }

        $scope.gTotal = total;
    };

    $scope.sendQuote = ()=>{
        $scope.data = [];
        // console.log($scope.ppu);

        for(var i = 0; i < $scope.ppu.length;i++){
            var serial = $scope.bearing1[i];
            var q = $scope.quantity[i];
            var ppu = $scope.ppu[i];
            var t = $scope.total[i];

            var c = {};
            c['serialNo']= serial;
            c['quantity'] = q;
            c['pricePerUnit'] = ppu;
            c['total'] = q * ppu;

            $scope.data.push(c);
            // console.log(c);
        }

        $scope.tosend = {};
        $scope.tosend.quoteBearings = $scope.data;
        $scope.tosend.gTotal = $scope.gTotal;


        console.log($scope.currentInq);
        socket.emit("sendQuote",$scope.tosend,$scope.currentInq);


        var notification = document.querySelector('.mdl-js-snackbar');
            notification.MaterialSnackbar.showSnackbar(
            {
            message: 'Quotation sent!',
            timeout: 5000,
            actionHandler: function(event) {
                notification.MaterialSnackbar.cleanup_();
            },
            actionText: 'Close',
            }
        );

        var toSend = {};
        toSend.dest = $scope.chatID;
        toSend.mess = "I have sent you a Quotation";
        socket.emit("sendMessage",toSend,$scope.currentInq.inquiryOwner);
    };




    $scope.updateFilter = ()=>{
        $scope.filterR = {'inquiryID': $stateParams.id};
        $(document).ready(function(){
        $('#convo').animate({
            scrollTop: $('#convo')[0].scrollHeight}, 0);
        });
    };


    $scope.sendMessage2 = ()=>{
        if($scope.inputMessage!=''){
            var toSend = {};
            toSend.dest = $scope.chatID;
            toSend.mess = $scope.inputMessage;
            socket.emit("sendMessage",toSend,$scope.currentInq.inquiryOwner);
            $scope.inputMessage = '';
        }
    };

    $scope.autojoinRoom = ()=>{
        socket.emit("joinRoom",$scope.chatID);
    };

    $scope.updateRead = ()=>{
        socket.emit("updateLastRead2",$scope.chatID);
    };

});

app.filter('customFilter', function(){
    return function (items,id) {
        var filtered = [];
        angular.forEach(items, function(item){
            if (item.inquiryID === id){
                filtered.push(item);
            }
        });
        return filtered;
    };
});

app.filter('inqFilter', function(){
    return function (items,id) {
        var filtered = [];
        angular.forEach(items, function(item){
            // console.log(id);
            // console.log(item.inquiryOwner.length);
            if (item.inquiryOwner === id){
                filtered.push(item);
            }
        });
        return filtered;
    };
});

app.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
        if(a!=undefined && b!=undefined)
        {
            return (a.lastMessage.messageTime > b.lastMessage.messageTime ? 1 : -1);
        }
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});

app.config(function($stateProvider,$urlRouterProvider) {
//  $urlRouterProvider.otherwise('/home');
$urlRouterProvider.otherwise('home/inbox');
  $stateProvider
    .state('home',{
        url:"/home",
        abstract: true,
        templateUrl: "templates/home.html"
    })
    .state('home.admin',{
      url:"/admin",
      templateUrl: "templates/admin.html"
    })
    //
    // .state('admin.create',{
    //   url:"/admin/create",
    //   templateUrl: "templates/adminCreate.html"
    // })
    //
    // .state('admin.info',{
    //   url:"/admin/info",
    //   templateUrl: "templates/info.html"
    // })
    //
    .state('home.history',{
      url: '/history',
      templateUrl: "templates/history.html"
    })
    .state('home.inbox',{
      url: '/inbox',
      templateUrl: "templates/inbox.html"
    })
    .state('home.inbox.chat',{
      url: '/chat/:id',
      templateUrl: "templates/chats.html"
    })
    .state('login',{
        url:'/login',
        templateUrl:"templates/login.html"
    })
    // .state('/', {
    //     url: '/',
    //     templateUrl: "templates/home.html"
    //
    // })
    ;
})


app.service('inqService', function() {
    var inqList = [];

    var addInq = function(newObj) {
    //   inqList.push(newObj);
        inqList = newObj;
        // console.log(inqList);
    };

    var getInq = function(){
      return inqList;
    };

    return {
        addInq: addInq,
        getInq: getInq
    };

});

app.service('userService', function() {
    var userList = [];

    var addUsers = function(newObj) {
    //   inqList.push(newObj);
        userList = newObj;
    };

    var getUsers = function(){
      return userList;
    };

    return {
        addUsers: addUsers,
        getUsers: getUsers
    };

});

app.service('messageService',function() {

    var messageConvo = [];
    var addMessage = function(newObj){
      messageConvo.push(newObj);
    };

    var getMessage = function(){
        return messageConvo;
    };

    return {
        addMessage: addMessage,
        getMessage: getMessage
    };
});
