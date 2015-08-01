// The main app module.
angular.module('bridge', [
  // angular deps
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ngCookies',
  // other deps
  'ui.bootstrap',
  'underscore',
  'jquery',
  'coreos',
  'ngTagsInput',
  // internal modules
  'templates',
  'k8s',
  'bridge.const',
  'bridge.filter',
  'bridge.service',
  'bridge.ui',
  'bridge.page',
  'core.pkg',
])
.config(function($routeProvider, $locationProvider, $httpProvider, configSvcProvider, apiClientProvider,
      errorMessageSvcProvider, flagSvcProvider, k8sConfigProvider) {
  'use strict';

  $locationProvider.html5Mode(true);
  flagSvcProvider.setGlobalId('SERVER_FLAGS');
  k8sConfigProvider.setBasePath('/api/kubernetes/' + window.SERVER_FLAGS.k8sVersion);
  $httpProvider.interceptors.push('unauthorizedInterceptorSvc');

  configSvcProvider.config({
    siteBasePath: '/',
    libPath: '/static/lib/coreos-web',
    jsonParse: true,
    detectHost: true,
    detectScheme: true,
  });

  apiClientProvider.settings({
    cache: false,
    apis: [{
      name: 'bridge',
      id: 'bridge:v1',
      rootUrl: window.location.origin,
      discoveryEndpoint: window.location.origin + '/api/bridge/v1/discovery/v1/rest'
    }]
  });

  errorMessageSvcProvider.registerFormatter('k8sApi', function(resp) {
    if (resp.data && resp.data.message) {
      return resp.data.message;
    }
    return 'An error occurred. Please try again.';
  });

  function r(route, config, unprotected) {
    if (!unprotected) {
      if (!config.resolve) {
        config.resolve = {};
      }
      config.resolve.ensureLoggedIn = 'ensureLoggedInSvc';
    }
    $routeProvider.when(route, config);
  }

  r('/', {
    controller: 'ClusterStatusCtrl',
    templateUrl: '/static/page/cluster/status.html',
    title: 'Cluster Status',
    resolve: {
      client: 'ClientLoaderSvc'
    }
  });
  r('/apps', {
    controller: 'AppsCtrl',
    templateUrl: '/static/page/apps/apps.html',
    title: 'Applications',
  });
  r('/ns/:ns/apps', {
    controller: 'AppsCtrl',
    templateUrl: '/static/page/apps/apps.html',
    title: 'Applications',
  });
  r('/ns/:ns/apps/new', {
    controller: 'NewAppCtrl',
    templateUrl: '/static/page/apps/new-app.html',
    title: 'Create New Application',
  });
  r('/events', {
    controller: 'EventsCtrl',
    templateUrl: '/static/page/events/events.html',
    title: 'Events',
  });
  r('/ns/:ns/events', {
    controller: 'EventsCtrl',
    templateUrl: '/static/page/events/events.html',
    title: 'Events',
  });
  r('/services', {
    controller: 'ServicesCtrl',
    templateUrl: '/static/page/services/services.html',
    title: 'Services',
  });
  r('/ns/:ns/services', {
    controller: 'ServicesCtrl',
    templateUrl: '/static/page/services/services.html',
    title: 'Services',
  });
  r('/ns/:ns/services/new', {
    controller: 'NewServiceCtrl',
    templateUrl: '/static/page/services/new-service.html',
    title: 'Create New Service',
  });
  r('/ns/:ns/services/:name', {
    controller: 'ServiceCtrl',
    templateUrl: '/static/page/services/service.html',
    title: 'Service',
  });
  r('/ns/:ns/services/:name/pods', {
    controller: 'ServicePodsCtrl',
    templateUrl: '/static/page/services/pods.html',
    title: 'Service Pods',
  });
  r('/replicationcontrollers', {
    controller: 'ReplicationcontrollersCtrl',
    templateUrl: '/static/page/replicationcontrollers/replicationcontrollers.html',
    title: 'Replication Controllers',
  });
  r('/ns/:ns/replicationcontrollers', {
    controller: 'ReplicationcontrollersCtrl',
    templateUrl: '/static/page/replicationcontrollers/replicationcontrollers.html',
    title: 'Replication Controllers',
  });
  r('/ns/:ns/replicationcontrollers/new', {
    controller: 'NewReplicationcontrollerCtrl',
    templateUrl: '/static/page/replicationcontrollers/new-replicationcontroller.html',
    title: 'New Replication Controller',
  });
  r('/ns/:ns/replicationcontrollers/:name/edit', {
    controller: 'EditReplicationcontrollerCtrl',
    templateUrl: '/static/page/replicationcontrollers/edit-replicationcontroller.html',
    title: 'Edit Replication Controller',
  });
  r('/ns/:ns/replicationcontrollers/:name', {
    controller: 'ReplicationcontrollerCtrl',
    templateUrl: '/static/page/replicationcontrollers/replicationcontroller.html',
    title: 'Replication Controller',
  });
  r('/ns/:ns/replicationcontrollers/:name/pods', {
    controller: 'ReplicationcontrollerPodsCtrl',
    templateUrl: '/static/page/replicationcontrollers/pods.html',
    title: 'Replication Controller Pods',
  });
  r('/pods', {
    controller: 'PodsCtrl',
    templateUrl: '/static/page/pods/pods.html',
    title: 'Pods',
  });
  r('/ns/:ns/pods', {
    controller: 'PodsCtrl',
    templateUrl: '/static/page/pods/pods.html',
    title: 'Pods',
  });
  r('/ns/:ns/pods/new', {
    controller: 'NewPodCtrl',
    templateUrl: '/static/page/pods/new-pod.html',
    title: 'Create New Pod',
  });
  r('/ns/:ns/pods/:name', {
    controller: 'PodCtrl',
    templateUrl: '/static/page/pods/pod.html',
    title: 'Pod',
  });
  r('/ns/:ns/pods/:name/events', {
    controller: 'PodSyseventsCtrl',
    templateUrl: '/static/page/pods/sysevents.html',
    title: 'Pod Events',
  });
  r('/ns/:ns/pods/:podName/containers/:name', {
    controller: 'ContainerCtrl',
    templateUrl: '/static/page/containers/container.html',
    title: 'Container',
  });
  r('/machines', {
    controller: 'MachinesCtrl',
    templateUrl: '/static/page/machines/machines.html',
    title: 'Machines',
  });
  r('/machines/:name', {
    controller: 'MachineCtrl',
    templateUrl: '/static/page/machines/machine.html',
    title: 'Machine',
  });
  r('/machines/:name/events', {
    controller: 'MachineSyseventsCtrl',
    templateUrl: '/static/page/machines/sysevents.html',
    title: 'Machine Events',
  });
  r('/machines/:name/pods', {
    controller: 'MachinePodsCtrl',
    templateUrl: '/static/page/machines/pods.html',
    title: 'Machine Pods',
  });
  // Alias for machines (for programatic routing).
  r('/nodes', {
    redirectTo: '/machines',
  });
  r('/nodes/:name', {
    redirectTo: '/machines/:name',
  });
  r('/search', {
    controller: 'SearchCtrl',
    templateUrl: '/static/page/search/search.html',
    title: 'Search',
  });
  r('/settings/registries', {
    controller: 'RegistriesCtrl',
    templateUrl: '/static/page/settings/registries.html',
    title: 'Configure Registries',
    resolve: {
      client: 'ClientLoaderSvc'
    }
  });
  r('/settings/users', {
    controller: 'UsersCtrl',
    templateUrl: '/static/page/settings/users.html',
    title: 'Users & API Keys',
    resolve: {
      client: 'ClientLoaderSvc'
    }
  });
  r('/welcome', {
    controller: 'WelcomeCtrl',
    templateUrl: '/static/page/welcome/welcome.html',
    title: 'Welcome to your CoreOS Cluster',
  });
  r('/error', {
    controller: 'ErrorCtrl',
    templateUrl: '/static/page/error/error.html',
    title: 'Error',
  }, true);

  $routeProvider.otherwise({
    templateUrl: '/static/page/error/404.html',
    title: 'Page Not Found (404)'
  });
})
.run(function($rootScope, $window, CONST, flagSvc, debugSvc, firehose, authSvc) {
  'use strict';
  // Convenience access for temmplates
  $rootScope.CONST = CONST;
  $rootScope.SERVER_FLAGS = flagSvc.all();
  $rootScope.debug = debugSvc;
  firehose.start();

  $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
    switch(rejection) {
      case 'not-logged-in':
        $window.location.href = '/auth/login';
        break;
    }
  });

  $rootScope.$on('xhr-error-unauthorized', function(e, rejection) {
    if (rejection && rejection.status === 401) {
      authSvc.logout($window.location.pathname);
    }
  });

});
