var api_url = "http://128.199.199.222:3011";

function GlobalVarsCtrl($rootScope,$location,$timeout,$localStorage) {
    $rootScope.public_folder = "http://128.199.199.222:3000/";
    $rootScope.pageTitleMain = "Database";
    
    $rootScope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
        /*
        //console.log("change",User.getUser(), toUrl.name);
        if(toUrl.name.indexOf("cms.") > -1 && (User.getUser()===null || User.getUser()===undefined)){
            //console.log("not login or not cms", User.getUser(), toUrl.name);
            $location.url('/login');
        }
        if(toUrl.name.indexOf("mailbox") > -1 && (User.getUser()===null || User.getUser()===undefined)){
            //console.log("not login or not cms", User.getUser(), toUrl.name);
            $location.url('/login');
        }
        */
    });
    
    $rootScope.gotopage = function(page){
        $location.url(page);
    }
    
    $rootScope.logout = function(){
        $rootScope.session.is_login = false;
        $rootScope.user = {};
        $rootScope.gotopage('/search/?');
    }
    
    $rootScope.list_of_keys = [
        ['C',1],
        ['C#/Db',2],
        ['D',3],
        ['D#/Eb',4],
        ['E',5],
        ['F',6],
        ['F#/Gb',7],
        ['G',8],
        ['G#/Ab',9],
        ['A',10],
        ['A#/Bb',11],
        ['B',12]
    ];
    
    $rootScope.keys_to_num = {
        'C': 1,
        'C#': 2,
        'Db': 2,
        'D': 3,
        'D#': 4,
        'Eb': 4,
        'E': 5,
        'F': 6,
        'F#': 7,
        'Gb': 7,
        'G': 8,
        'G#': 9,
        'Ab': 9,
        'A': 10,
        'A#': 11,
        'Bb': 11,
        'B': 12
    };
    $rootScope.keys_to_num_inverse = {
        '1':['C'],
        '2':['C#','Db'],
        '3':['D'],
        '4':['D#','Eb'],
        '5':['E'],
        '6':['F'],
        '7':['F#','Gb'],
        '8':['G'],
        '9':['G#','Ab'],
        '10':['A'],
        '11':['A#','Bb'],
        '12':['B']
    };
    
    $rootScope.all_keys = {
      'C': {id: 'C', name: 'C'},
      'D': {id: 'D', name: 'D'},
      'E': {id: 'E', name: 'E'},
      'F': {id: 'F', name: 'F'},
      'G': {id: 'G', name: 'G'},
      'A': {id: 'A', name: 'A'},
      'B': {id: 'B', name: 'B'},
      'Bb': {id: 'Bb', name: 'Bb'},
    };
    
    $rootScope.prefer_sharps_flats = 0;
    $rootScope.thiskey_has_sharp_flat = false;
    $rootScope.search_type = 2; //toggle between search lyrics/title

    $rootScope.session = $localStorage.$default({
      is_login: false,
      user: {},
      songs: []
    });
    
    $rootScope.this_order = $localStorage.$default({
        songs: []
    });
    
    $rootScope.add_to_order = function(song){
        console.log("adding",song);
      if(!("thiskey" in song)){
        if("basekey" in song){
          if(song.basekey!=""){
              song.thiskey = song.basekey;
          }
        }
      }

      if(!("body" in song)){
        song = $rootScope.raw_to_html(song);
      }

      $rootScope.session.songs.push(song);
      $rootScope.div_ok_container = {display:'block'};
      $timeout(function(){
        $rootScope.div_ok_container = {display:'none'};
      }, 1000);
    }
    
    $rootScope.raw_to_html = function(song){
        
        song.body = "";
        var verse_counter = 1;
        
        if(song.thiskey.indexOf('#')>-1 || song.thiskey.indexOf('b')>-1){
            $rootScope.thiskey_has_sharp_flat = true;
        }else{
            $rootScope.thiskey_has_sharp_flat = false;
        }
        
        var part_counter = 0;
        var parts = song.raw.split("_");
        parts.shift();
        parts.forEach(function(part){
            
            song.body+= "<div class='col-md-4'>";
            
            if(part.substring(0, 1) == "C"){
                song.body+= "<div class='chorus'><span class='badge badge-success'>Chorus</span>";
            }else if(part.substring(0, 1) == "V"){
                song.body+= "<div class='verses'><span class='badge badge-primary'>Verse "+verse_counter+"</span>";
                verse_counter++;
            }else if(part.substring(0, 1) == "B"){
                song.body+= "<div class='bridge'><span class='badge badge-info'>Bridge</span>";
            }
            else if(part.substring(0, 1) == "P"){
                song.body+= "<div class='bridge'><span class='badge badge-success'>Pre-Chorus</span>";
            }
            else if(part.substring(0, 1) == "R"){
                song.body+= "<div class='bridge'><span class='badge badge-warning'>Refrain</span>";
            }
            else if(part.substring(0, 1) == "I"){
                song.body+= "<div class='bridge'><span class='badge badge-warning'>Intro</span>";
            }
            
            song.body+= "</div>";
            
            part = part.slice(2,part.length);
            
            var lines = part.split("\n");
            lines.forEach(function(line){
                
                if(line!=''){
                    song.body+= '<p class="lyric">';
                    var arrStr = line.split(/[\[\]]+/);
                    
                    for(var i=0;i<arrStr.length;i++){
                        if(i%2===0){
                            song.body+= arrStr[i];
                        }else{
                            $rootScope.transpose({basekey:song.basekey, tokey:song.thiskey, thiskey:arrStr[i]}, function(newkey) {
                                song.body+= '<span class="chord"><span class="inner">'+ newkey +'</span></span>';
                            });
                        }
                    }
                    song.body+= '</p>';
                }
            });
            
            song.body+= "</div>";
            
            part_counter++;
            if(part_counter%3 == 0){
                song.body+= "<div class='clear_both'></div>";
            }
        });
        
        return song;
    }
    
    
    $rootScope.transpose = function(query, callback){
        if(query.basekey && query.tokey){
            var base_number = $rootScope.keys_to_num[query.basekey];
            var to_number = $rootScope.keys_to_num[query.tokey];
            var gap = to_number - base_number;
            
            var done_n = [];
            var thiskey = query.thiskey;
            var i = 0;
            var newkey = "";
            
            while(i < thiskey.length){
                
                if(thiskey[i] in $rootScope.keys_to_num){
                    var tempnewkey = "";
                    if(thiskey[i]+thiskey[(i+1)] in $rootScope.keys_to_num){
                        var get_new_thiskey = $rootScope.keys_to_num[ thiskey[i]+thiskey[(i+1)] ] + gap;
                        if(get_new_thiskey < 1){
                            get_new_thiskey = 12 + get_new_thiskey;
                        }else if(get_new_thiskey>12){
                            get_new_thiskey = get_new_thiskey - 12;
                        }
                        tempnewkey = $rootScope.keys_to_num_inverse[get_new_thiskey];
                        if(tempnewkey.length>1){
                            newkey+= tempnewkey[$rootScope.prefer_sharps_flats];
                        }else{
                            newkey+= tempnewkey[0];
                        }
                        
                        i=i+2;
                    }else{
                        var get_new_thiskey = $rootScope.keys_to_num[ thiskey[i] ] + gap;
                        if(get_new_thiskey < 1){
                            get_new_thiskey = 12 + get_new_thiskey;
                        }else if(get_new_thiskey>12){
                            get_new_thiskey = get_new_thiskey - 12;
                        }
                        tempnewkey = $rootScope.keys_to_num_inverse[get_new_thiskey];
                        if(tempnewkey.length>1){
                            newkey+= tempnewkey[$rootScope.prefer_sharps_flats];
                        }else{
                            newkey+= tempnewkey[0];
                        }
                        i++;
                    }
                }else{
                    newkey+= thiskey[i];
                    i++;
                }
            }
            
            // var keys_table = {
            //     "C": ["C","D","E","F","G","A","Bb"],
            //     "D": ["D","E","F#","G","A","B","C"],
            //     "E": ["E","F#","G#","A","B","C#","D"],
            //     "F": ["F","G","A","Bb","C","D","Eb"],
            //     "G": ["G","A","B","C","D","E","F"],
            //     "A": ["A","B","C#","D","E","F#","G"],
            //     "B": ["B","C#","D#","E","F#","G#","A"],
            //     "Bb": ["Bb","C","D","Eb","F","G","G#"],
            // };
            
            // var this_keys = keys_table[query.basekey];
            // var that_keys = keys_table[query.tokey];
            
            // var done_n = [];
            // var newkey = query.thiskey;
            // var i = 0;
            
            // for(i in this_keys){
            //     var count = 0;
            //     while(count < newkey.length){
            //         var n = newkey.indexOf(this_keys[i]);
            //         if(n>-1 && !(n in done_n)){
            //             done_n.push(n);
            //             newkey = newkey.substring(0, n) + that_keys[i] + newkey.substring(n+this_keys[i].length, newkey.length);
            //         }
            //         count++;
            //     }
            // }
            callback(newkey);
        }
    }
}

function SearchController($rootScope, $scope, $http, $stateParams) {
    
    if($stateParams.keywords){
        $rootScope.searchterms = $stateParams.keywords;
    }
    
    $scope.found_nothing = true;
    
    $scope.search_songs = function(terms){
        document.getElementById('id_pagetitle').innerHTML = terms + " | Worship Database";
        $rootScope.gotopage('/search/'+terms);
        $scope.found_nothing = true;
        
        if(terms){
            $scope.found_nothing = false;
            $scope.$parent.div_loading_container = {display:'block'};
            
            $scope.all_searched_songs = [];
            $rootScope.searchTerm = terms;
            
            if($rootScope.search_type==1){
                var request = $http({
                    method: "post",
                    url: api_url+"/search_songs_by_terms",
                    data: {
                        terms: terms
                    }
                }).success(
                    function(data) {
                        if(data.results.length){
                            for(i in data.results){
                                data.results[i].obj.score = data.results[i].score;

                                var arr = data.results[i].obj.lyrics.split("<br/>");
                                var temp = "";
                                for(j=0;j<4;j++){
                                    if(arr[j]){
                                        temp+= arr[j]+"<br/>";
                                    }
                                }
                                data.results[i].obj.subset_lyrics = temp;
                                
                                $scope.all_searched_songs.push( data.results[i].obj );
                            }
                        }else{
                            $scope.found_nothing = true;
                        }
                        $scope.$parent.div_loading_container = {display:'none'};
                    }
                );
            }else{
                var request = $http({
                    method: "post",
                    url: api_url+"/search_songs_by_title",
                    data: {
                        title: terms
                    }
                }).success(
                    function(data) {
                        if(data.length){
                            for(i in data){
                                var arr = data[i].lyrics.split("<br/>");
                                var temp = "";
                                for(j=0;j<5;j++){
                                    if(arr[j]){
                                        temp+= arr[j]+"<br/>";
                                    }
                                }
                                data[i].subset_lyrics = temp;
                            }
                            $scope.all_searched_songs = data;
                            $scope.$parent.div_loading_container = {display:'none'};
                        }else{
                            $scope.found_nothing = true;
                        }
                        $scope.$parent.div_loading_container = {display:'none'};
                    }
                );
            }
        }
    }
    if($rootScope.searchterms){
        $scope.search_songs($rootScope.searchterms);
    }else{
        console.log('else search');
    }
    
    $scope.change_search_type = function(id){
        $rootScope.search_type=id;
        if($rootScope.searchterms)
            $scope.search_songs($rootScope.searchterms);
    }
    
}

function SongController($rootScope, $scope, $stateParams, $http) {
    
    //$scope.$parent.selectedIndex = -1;
    //$scope.this_song = null;
    //$scope.all_keys = $rootScope.all_keys;
    
    // if($rootScope.session.is_login === true){
    //     if($rootScope.user.account_type < 2){
    //         $scope.is_edit = true;
    //     }
    // }
    
    $scope.is_edit = false;
    var is_new_song = false;
    
    $scope.edit_song = function(bool){
        $scope.is_edit = bool;
    }
    
    $scope.check = function(){
        console.log($scope.is_edit);
    }
    
    $scope.get_song = function(id){
        $scope.$parent.div_loading_container = {display:'block'};
        
        var request = $http({
            method: "post",
            url: api_url+"/get_song_by_id",
            data: {
                id: id
            }
        }).success(
            function(data) {
                if(!data.fail){
                    console.log("this song",data);
                    $scope.this_song = data;
                    $scope.this_song.thiskey = $scope.this_song.basekey;
                    $scope.this_song = $rootScope.raw_to_html(data);
                    
                    // var myEl = angular.element( document.querySelector( '#song_raw' ) );
                    // myEl.attr('rows',data.lines_count);
                    
                    if("metadata" in $scope.this_song){
                        if("Scripture Reference(s)" in $scope.this_song.metadata){
                            $scope.this_song.metadata['Scripture Reference(s)'] = $scope.this_song.metadata['Scripture Reference(s)'][0].split(/[;,]+/)
                        }
                    }
                    
                    $rootScope.songs[0].url = $scope.this_song.mp3;
                    
                    document.getElementById('id_pagetitle').innerHTML = data.title + " | Worship Database";
                }else{
                    console.log(data.msg);
                }
                
                $scope.$parent.div_loading_container = {display:'none'};
            }
        );
    }
    
    if($stateParams.song_id=="new"){
        //if login as correct account type, create empty song Object
        //check if song title exists
        if($rootScope.session.is_login && $rootScope.session.user.account_type < 2){
            $scope.this_song = {basekey: "",
                raw: "",
                thiskey: "",
                title: "",
                lines_count: 20
            };
            is_new_song = true;
            $scope.edit_song(true);
        }
        
    }else{
        $scope.get_song($stateParams.song_id);
    }
    
    $scope.last_key_id = 0;
    $scope.changeKey = function(id, song){
        $scope.last_key_id = id;
        var arr_keys = $rootScope.keys_to_num_inverse[id.toString()];
        if(arr_keys.length==1){
            song.thiskey = arr_keys[0];
        }else{
            song.thiskey = arr_keys[$rootScope.prefer_sharps_flats];
        }
        song = $rootScope.raw_to_html(song);
    }
    
    $scope.toggle_sharps_flats = function(sharp_flat,song){
        $rootScope.prefer_sharps_flats = sharp_flat;
        $scope.changeKey($scope.last_key_id,song);
    }
    
    $scope.changeBaseKey = function(key){
        $scope.this_song.basekey = key;
    }
    
    $scope.change_lyrics = function(){
        if($scope.this_song.basekey){
            $scope.this_song.thiskey = $scope.this_song.basekey;
            $scope.this_song = $rootScope.raw_to_html($scope.this_song);
        }
    }
    
    $scope.edit_add_part = function(part){
        $scope.this_song.raw += "\n"+part+"\n";
    }
    
    $scope.updateSong = function(){
        $scope.$parent.div_loading_container = {display:'block'};
        
        delete $scope.this_song["body"];
        delete $scope.this_song["thiskey"];
        console.log("after delete",$scope.this_song);
        
        if(is_new_song){
            $scope.this_song.metadata = {};
            $scope.this_song.metadata.addedby = $rootScope.session.user.email;
            $scope.this_song.metadata.addedon = new Date().getTime();
            
            var request = $http({
                method: "post",
                url: api_url+"/add_song",
                data: {
                    song: $scope.this_song
                }
            }).success(
                function(data) {
                    console.log('gotten',data);
                    $scope.this_song = data;
                    $scope.this_song.thiskey = $scope.this_song.basekey;
                    $scope.this_song = $rootScope.raw_to_html(data);
                    $scope.$parent.div_loading_container = {display:'none'};
                    
                    $rootScope.gotopage('/song/'+$scope.this_song._id);
                }
            );
            is_new_song = false;
        }else{
            if(!("metadata" in $scope.this_song)){
                $scope.this_song.metadata = {};
            }
            $scope.this_song.metadata.editedby = $rootScope.session.user.email;
            $scope.this_song.metadata.editedon = new Date().getTime();
            
            var request = $http({
                method: "post",
                url: api_url+"/update_song",
                data: {
                    song: $scope.this_song
                }
            }).success(
                function(data) {
                    console.log('gotten',data);
                    $scope.this_song = data;
                    $scope.this_song.thiskey = $scope.this_song.basekey;
                    $scope.this_song = $rootScope.raw_to_html(data);
                    $scope.$parent.div_loading_container = {display:'none'};
                    $rootScope.gotopage('/song/'+$scope.this_song._id);
                }
            );
        }
        
    }
    
    $scope.add_to_order = function(){
        $rootScope.add_to_order($scope.this_song);
    }
    
    $scope.play_music = function(){
        $rootScope.songs[0].url = $scope.this_song.mp3;
        $rootScope.songs[0].title = $scope.this_song.title;
    }
        
}

function MusicplayerController($rootScope) {
    $rootScope.openChat = false;
    $rootScope.songs = [
        {
            id: 'one',
            url: 'http',
            title: ''
        },
    ];
}

function OrderController($rootScope, $scope, $stateParams, $element, $timeout, $http) {
    
    $scope.showhide = function () {
        var ibox = $element.closest('div.ibox');
        var icon = $element.find('i:first');
        var content = ibox.find('div.ibox-content');
        content.slideToggle(200);
        // Toggle icon from up to down
        icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
        ibox.toggleClass('').toggleClass('border-bottom');
        $timeout(function () {
            ibox.resize();
            ibox.find('[id^=map-]').resize();
        }, 50);
    };
    
    $scope.sortableOptions = {
        connectWith: ".connectPanels",
        handler: ".ibox-title"
    };
}

function AccountsController($rootScope, $scope, $http) {
    
    $scope.do_login = function () {
        request = $http({
            method: "post",
            url: api_url+"/login",
            data: {
                user_login: $scope.login_username.toLowerCase(),
                user_pass: $scope.login_password
            }
        }).success(
            function(res) {
                console.log("login",res);
                if(res){
                    $rootScope.session.is_login = true;
                    $rootScope.session.user = res;
                    $rootScope.gotopage('/search/?');
                }
            }
        );
    };
    
    $scope.admin_custom = function () {
        console.log('admin_custom');
        
        request = $http({
            method: "post",
            url: api_url+"/add_user",
            data: {
            }
        }).success(
            function(res) {
                console.log("admin_custom",res);
            }
        );
    };
}

/**
 *
 * Pass all functions into module
 */

angular
    .module('inspinia')
    .controller('GlobalVarsCtrl', GlobalVarsCtrl)
    .controller('SearchController', SearchController)
    .controller('SongController', SongController)
    .controller('OrderController', OrderController)
    .controller('MusicplayerController', MusicplayerController)
    .controller('AccountsController', AccountsController)
