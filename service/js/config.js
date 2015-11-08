/**
 * INSPINIA - Responsive Admin Theme
 *
 * Inspinia theme use AngularUI Router to manage routing and views
 * Each view are defined as state.
 * Initial there are written state for all view in theme.
 *
 */
function config($stateProvider, $urlRouterProvider, $ocLazyLoadProvider) {

    $urlRouterProvider.otherwise("/search/?");
    
    $ocLazyLoadProvider.config({
        debug: false // Set to true if you want to see what and when is dynamically loaded
    });
    
    $stateProvider
        
        .state('landing', {
            url: "/",
            templateUrl: "views/home.html",
            data: { pageTitle: 'Welcome' }
        })
        .state('login', {
            url: "/login",
            templateUrl: "views/login.html",
            data: { pageTitle: 'Login' }
        })
        .state('search', {
            abstract: true,
            url: "/search",
            templateUrl: "views/common/content_top_navigation.html",
        })
        .state('search.keywords', {
            url: "/:keywords",
            templateUrl: "views/search_results.html",
            data: { },
        })
        .state('song', {
            abstract: true,
            url: "/song",
            templateUrl: "views/common/content_top_navigation.html",
        })
        .state('song.song_id', {
            url: "/:song_id",
            templateUrl: "views/song.html",
            data: { },
        })
        .state('order', {
            abstract: true,
            url: "/order",
            templateUrl: "views/common/content_top_navigation.html",
        })
        .state('order.order_id', {
            url: "/:order_id",
            templateUrl: "views/order.html",
            data: { pageTitle: 'Order' },
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            name: 'ui.sortable',
                            files: ['common/inspinia/js/plugins/ui-sortable/sortable.js']
                        }
                    ]);
                }
            }
        })
}

angular
.module('inspinia')
.config(config)
.run(function($rootScope, $state) {
    $rootScope.$state = $state;
});