 'use strict';
function cdBadgesDashboardCtrl($scope, cdBadgesService, utilsService, alertService, $translate, auth, cdDojoService, usSpinnerService, cdUsersService) {
  $scope.badges = {};
  $scope.badgeInfo = {};
  $scope.badgeInfoIsCollapsed = {};
  $scope.claimerIds = [];
  $scope.claimerDropdownSettings = {
    idProp: 'id',
    externalIdProp: '',
    displayProp: 'name',
    showUncheckAll: false,
    showCheckAll: false,
    scrollableHeight: '200px',
    scrollable: true
  };
  var lastClicked = {};
  var errorMsg = $translate.instant('error.general');

  auth.instance(function (data) {
    $scope.user = data.user;
    $scope.isDojoAdmin = false;

    if(data.user) {
      var query = {userId: data.user.id};

      cdDojoService.getUsersDojos({userId: $scope.user.id, deleted: 0}, function (usersDojos) {
        var userDojo = usersDojos[0];
        var isDojoAdmin;
        if(userDojo) {
          $scope.isDojoAdmin = _.find(userDojo.userPermissions, function (userPermission) {
            return userPermission.name === 'dojo-admin';
          });
        }
      });
      cdUsersService.userProfileData({userId: $scope.user.id}, function (profile) {
        if (profile) {
          $scope.profile = profile;
          if (profile.children) {
            var children = {};
            _.forEach(profile.children, function(child, index){
              cdUsersService.userProfileData({userId: child}, function(childProfile){
                profile.children[index] = childProfile;
              });
            });
          }
        }
      });
    }
  });

  cdBadgesService.listBadges(function (response) {
    usSpinnerService.stop('badge-spinner');
    var badges = response.badges;

    //Filter badges because badgekit api doesn't support querying by tags.
    cdBadgesService.loadBadgeCategories(function (response) {
      $scope.categories = response.categories;
      _.each($scope.categories, function (category) {
        _.each(badges, function (badge) {
          var indexFound;
          var categoryFound = _.find(badge.tags, function (tag, index) {
            indexFound = index;
            return tag.value === category;
          });

          if(categoryFound) {
            var tmpBadge = angular.copy(badge);
            tmpBadge.tags.splice(indexFound, 1);
            if(!$scope.badges[category]) $scope.badges[category] = {};
            _.each(tmpBadge.tags, function (tag) {
              if(!$scope.badges[category][tag.value]) $scope.badges[category][tag.value] = [];
              $scope.badges[category][tag.value].push(badge);
            });
          }
        });
      });
    });
  }, function(err) {
    usSpinnerService.stop('badge-spinner');
    console.log(err);
  });

  $scope.prepareHeading = function(heading){
    return heading.replace(/-/g, ' ').replace(/\w\S*/g, function(str){return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();}); // capitalize first letter of each word
  };

  $scope.showBadgeInfo = function (tag, badge) {
    if(lastClicked[tag] !== badge.id && $scope.badgeInfoIsCollapsed[tag]) {
      $scope.badgeInfo[tag] = badge;
    } else {
      $scope.badgeInfo[tag] = badge;
      $scope.badgeInfoIsCollapsed[tag] = !$scope.badgeInfoIsCollapsed[tag];
    }
    lastClicked[tag] = badge.id;
  };

  $scope.categorySelected = function () {
    lastClicked = {};
    $scope.badgeInfoIsCollapsed = {};
  };

  $scope.previewBadge = function (badgeClaimNumber) {
    cdBadgesService.loadBadgeByCode(badgeClaimNumber, function (response) {
      if(response.error) return alertService.showError(errorMsg);
      if(_.isEmpty(response)) {
        $scope.hideBadgePreview();
        return alertService.showAlert($translate.instant('Invalid Badge Claim Number.'));
      }
      $scope.previewBadgeData = response.badge;
      $scope.showBadgePreview = true;
    });
  };

  $scope.hideBadgePreview = function () {
    $scope.badgeClaimNumber = '';
    $scope.previewBadgeForm.submitted = false;
    $scope.previewBadgeForm.$setPristine();
    $scope.previewBadgeData = {};
    $scope.showBadgePreview = false;
  };

  $scope.claimBadge = function () {
    if(!_.isEmpty($scope.claimerIds)){
      _.forEach($scope.claimerIds, function (child){
        cdBadgesService.claimBadgeFor($scope.previewBadgeData, child.userId, cb);
      });
    } else {
      cdBadgesService.claimBadge($scope.previewBadgeData, cb);
    }

    function cb (response){
      $scope.hideBadgePreview();
      if(response.error) return alertService.showError($translate.instant(response.error));
      return alertService.showAlert($translate.instant('You have successfully claimed a badge. It is now visible on your profile page.'));
    }
  };

}

angular.module('cpZenPlatform')
  .controller('badges-dashboard-controller', ['$scope', 'cdBadgesService', 'utilsService', 'alertService', '$translate', 'auth', 'cdDojoService', 'usSpinnerService', 'cdUsersService', cdBadgesDashboardCtrl]);
