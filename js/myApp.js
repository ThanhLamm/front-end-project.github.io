var app = angular.module('myapp', ['ngRoute', 'ngCookies']);

//hien password
function hidePass() {
    var x = document.getElementById("myPass");
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
}
//single page
app.config(function($routeProvider){
    $routeProvider
    .when('/faq', {
        templateUrl: 'views/faq.html?' + Math.random()
    })
    .when('/quiz/:id/:name', {
        templateUrl: 'views/quiz.html?' + Math.random(),
        controller: 'quizCtrl'
    })
    .when('/subjects', {
        templateUrl: 'views/subjects.html?' + Math.random(),
        controller:  'subjectCtrl'
    })
    .when('/about', {
        templateUrl: 'views/about.html?' + Math.random()
    })
    .when('/user', {
        templateUrl: 'views/user.html?' + Math.random(),
        controller: 'userCtrl'
    })
    .when('/friend',{
        templateUrl: 'views/friends.html?' + Math.random(),
        controller: 'friendsCtrl'
    })
    .otherwise({
        redirectTo: '/about'
        // templateUrl: 'views/user.html?' + Math.random()
    })
});
app.run(function ($rootScope){
    $rootScope.$on('$routeChangeStart', function() {
        $rootScope.loading = true;
        // console.log('dang load')
    })
    $rootScope.$on('$routeChangeSuccess', function() {
        $rootScope.loading = false;
        // console.log('load xong')
    })
    $rootScope.$on('$routeChangeError', function() {
        $rootScope.loading = false;
        // console.log('Loi, khong tai duoc template')
    })
})

// phan trang
app.controller("subjectCtrl", function($scope, $http){
    $scope.list_subjects = [];
    $http.get('db/Subjects.js').then(function(res){
        $scope.list_subjects = res.data;
    })
    $scope.begin = 0;
    $scope.prev = function() {
        if($scope.begin < $scope.list_subjects.length-6) {
            $scope.begin += 6;
        }
    }
    $scope.back = function() {
        if($scope.begin >= 6) {
            $scope.begin -= 6;
        }
    }
    $scope.one = function() {
        $scope.begin = 6*0;
    }
    $scope.two = function() {
        $scope.begin = 6*1;
    }
});

//quiz
app.controller("quizCtrl", function($scope, $quizFactory, $routeParams, $interval, $cookies, $http){
    $scope.score = 0;
    $scope.start = function() {
        $quizFactory.getQuestions().then(function(){
            $scope.subjectName = $routeParams.name;
            $scope.id = 0;
            $scope.score = 0;
            $scope.inProgess = true; //hien thi nut start
            $scope.quizOver = false; //chua hoan thanh bai thi
            $scope.getQuestion();
            $scope.count();
        })
    }
    $scope.reset = function() {
        $scope.inProgess = false;
    }
    $scope.getQuestion = function() {
        var quiz = $quizFactory.getQuestion($scope.id);
        if(quiz) {
            $scope.question = quiz.Text; //cau hoi
            $scope.options = quiz.Answers; //cau tra loi
            $scope.answer = quiz.AnswerId; //id cua dap an dung
            $scope.answerMode = true; //check xem da answer chua (lúc đổ câu hỏi lên thì sẽ hiện nút Submit)
        } else {
            $scope.quizOver = true; //da hoan thanh
            $scope.stop();
        }    
    }
    $scope.checkAnswer = function() {
        // console.log($('input[name = answer]:checked').length)
        if($('input[name = answer]:checked').length < 1) {
            // console.log('chua chon')
            $scope.check = true; //check xem đã chọn cau trả lời chưa
            return;
        }
        $scope.check = false;
        var answer = $('input[name = answer]:checked').val();
        if(answer == $scope.answer) {
            $scope.score++;
            $scope.correct = true;
        } else {
            $scope.correct = false;
        }
        $scope.answerMode = false;
    }
    $scope.nextQuestion = function() {
        $scope.id++;
        $scope.getQuestion();
    }
    //bo dem thoi gian
    $scope.countDown;
    var promise;
    $scope.count = function() {
        //dung moi internal tranh chay 2 cai cung luc
        $interval.cancel(promise);
        $scope.countDown=600;
        promise = $interval(function(){
            $scope.countDown--;
            // console.log($scope.countDown)
            if($scope.countDown==0) {
                $scope.stop();
            }
        }, 1000);
    }
    $scope.stop = function() {
        $interval.cancel(promise);
        $scope.quizOver = true;
        $scope.countDown = 600;
    }
    $scope.reset();

    //luu kq
    $scope.saveKQ = function() {
        var user = $cookies.getObject('user');
        var subject = $routeParams.name;
        var mark = $scope.score;
        var date = new Date();

        var marks = user.marks;
        // console.log(marks)
        marks.push(
            {
                "name": subject,
                "mark": mark,
                "date": date
            }
        )
        // console.log('--------------------------------')
        // console.log(marks)
        

        var data = {
            username: user.username,
            password: user.password,
            fullname: user.fullname,
            email: user.email,
            gender: user.gender,
            birthday: user.birthday,
            schoolfee: user.schoolfee,
            country: user.country,
            marks: marks,
            id: user.id
        }
        $http.put('https:/lamnht-app.herokuapp.com/listStudents/'+user.id, data).then(function(res){
            // console.log('done')
            $cookies.putObject('user', data, 24*60*60);
            alert('Lưu thành công !');
            // window.location.href = "index.html";
            // alert('Đăng nhập lại để cập nhật hoàn tất !');
            // $scope.logout();
        }), function(error) {
            console.log('fail')
        }
        // console.log(user);
        // console.log(subject);
        // console.log(date);
        // console.log(mark);
    }
});

//dinh dang thoi gian
app.filter('secondsToDateTime', [function() {
    return function(countDown) {
        return new Date(1970, 0, 1).setSeconds(countDown);
    };
}])

app.factory('$quizFactory', function($http, $routeParams){    
    return {
        getQuestions:function(){
            return $http.get('db/Quizs/'+$routeParams.id+'.js').then(function(response){
                questions = response.data;
                // console.log('db/Quizs/'+$routeParams.id+'.js')
                // console.log($routeParams.name)
                // console.log(questions.length)
            });
        },

        getQuestion:function(id) {
            // var count = question.length;
            // if(count > 10) {
            //     count = 10;
            // }
            var randomItem = questions[Math.floor(Math.random() * questions.length)];
            if(id<10) {
                return randomItem;
            } else {
                return false;
            }
        }
    }
    
})

//User
app.controller("userCtrl", function($scope, $cookies, $http){
    $scope.user = $cookies.getObject('user');
    $scope.marks = [];
    if($scope.user != null) {
        $scope.marks = $scope.user.marks;
    }
    // console.log($scope.user)
    if($cookies.getObject('user') == null) {
        // console.log('dang xuat r')
        $scope.isLogin = false;
    } else {
        // console.log('dang nhap r')
        $scope.isLogin = true;
    }
    $scope.login = function() {
        $http.get('https:/lamnht-app.herokuapp.com/listStudents').then(function(res){
            listData = res.data;
            // console.log(listData)
            for(var i = 0; i < listData.length; i++) {
                if(listData[i].username == $scope.username && listData[i].password == $scope.password) {
                    // console.log('done login')
                    $scope.isLogin = true;
                    $cookies.putObject('user', listData[i], 24*60*60);
                    alert("Đăng nhập thành công !")
                    window.location.href = "index.html";
                    return;
                } else {
                    $scope.isLogin = false;
                }
            }
            alert('Tài khoản hoặc mật khẩu không đúng !')
        });
    }
    $scope.logout = function() {
        window.location.href = 'index.html';
        $cookies.remove('user');
    }

    $scope.register = function(even) {
        $http.get('https:/lamnht-app.herokuapp.com/listStudents').then(function(res){
            listData = res.data;
            for(var i = 0; i < listData.length; i++) {
                if(listData[i].username == $scope.usernamedk) {
                    // console.log('deo dc r')
                    alert('Tên đăng nhập đã tồn tại! \nVui lòng chọn tên khác!')
                    return;
                } else {
                    // console.log('ok')
                }
            }
            var data = {
                username: $scope.usernamedk,
                password: $scope.passworddk,
                fullname: $scope.namedk,
                email: $scope.emaildk,
                gender: $scope.genderdk,
                birthday: $scope.birthdatedk,
                schoolfee: 0,
                country: $scope.countrydk,
                marks: []
            }
            // console.log(data)
            $http.post('https:/lamnht-app.herokuapp.com/listStudents', data).then(function(res){
                // console.log('done')
                alert('Đăng kí thành công !');
                window.location.href = "index.html";
            }), function(error) {
                console.log('fail')
            }
        });        
    }

    $scope.forgotPassword = function() {
        $http.get('https:/lamnht-app.herokuapp.com/listStudents').then(function(res){
            listData = res.data;
            for(var i = 0; i < listData.length; i++) {
                if(listData[i].username == $scope.usernameqmk && listData[i].email == $scope.emailqmk) {
                    alert('Mật khẩu của bạn là '+listData[i].password+'\nBạn đừng đãng trí nữa nhé <3')
                    return;
                } else {

                }
            }
            alert('Email hoặc tài khoản không đúng!')
        });
    }

    $scope.editProfile = function(even) {
        var data = {
            username: $scope.user.username,
            password: $scope.user.password,
            fullname: $scope.editName,
            email: $scope.editEmail,
            gender: $scope.editGender,
            birthday: $scope.editBirthDate,
            schoolfee: $scope.user.schoolfee,
            country: $scope.editCountry,
            marks: $scope.user.marks,
            id: $scope.user.id
        }
        $http.put('https:/lamnht-app.herokuapp.com/listStudents/'+$scope.user.id, data).then(function(res){
            // console.log('done')
            alert('Cập nhật thành công !');
            $cookies.putObject('user', data, 24*60*60);
            // alert('Đăng nhập lại để cập nhật hoàn tất !');
            // $scope.logout();
        }), function(error) {
            console.log('fail')
        }
    }

    $scope.changePassword = function(even) {
        if($scope.matkhaudmk != $scope.user.password) {
            alert('Bạn đã nhập sai mật khẩu hiện tại !');
            return;
        }
        if($scope.matkhaumoidmk != $scope.xacnhanmkdmk) {
            alert('Mật khẩu xác nhận không trùng khớp !');
            return;
        }
        var data = {
            username: $scope.user.username,
            password: $scope.matkhaumoidmk,
            fullname: $scope.user.fullname,
            email: $scope.user.email,
            gender: $scope.user.gender,
            birthday: $scope.user.birthday,
            schoolfee: $scope.user.schoolfee,
            country: $scope.user.country,
            marks: $scope.user.marks,
            id: $scope.user.id
        }
        $http.put('https:/lamnht-app.herokuapp.com/listStudents/'+$scope.user.id, data).then(function(res){
            // console.log('done')
            alert('Đổi mật khẩu thành công !');
            $cookies.putObject('user', data, 24*60*60);
            // alert('Đăng nhập lại để cập nhật hoàn tất !');
            // $scope.logout();
        }), function(error) {
            console.log('fail')
        }
    }
})

app.controller('friendsCtrl', function($scope, $cookies, $http) {
    $scope.userOld = $cookies.getObject('user');
    $http.get('https:/lamnht-app.herokuapp.com/listStudents').then(function(res){
        $scope.friends = res.data;
    })
})