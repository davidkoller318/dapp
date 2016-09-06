import {default as Modules} from "./_modules";

/*****
/* @param {string} feed - option selected.
******/
let sidebarMenu = (feed) => {

  var decisions = new Array();
  var personal = new Array();
  var delegates = new Array();

  if (Meteor.user() != undefined) {

    decisions = _getDecisionsMenu(feed);
    personal = _getPersonalMenu(feed);
   //delegates = _getDelegatesMenu(feed);

  }

  if (feed == '' || feed == undefined) {
    if (Session.get('sidebarMenuSelectedId') != undefined) {
      decisions = _rememberSelectedItem(decisions);
      personal = _rememberSelectedItem(personal);
    }
  }

  Session.set('menuDecisions', decisions);
  Session.set('menuPersonal', personal);
  //Session.set('menuDelegates', delegates);

}

let _rememberSelectedItem = (arrMenu) => {
  for (item in arrMenu) {
    if (arrMenu[item].id == Session.get('sidebarMenuSelectedId')) {
      arrMenu[item].selected = true;
      break;
    }
  }
  return arrMenu;
}




let _getDecisionsMenu = (feed) => {
  var menu = new Array();

  menu.push(
    {
      id: 1,
      label: TAPi18n.__('open'),
      value: Meteor.user().profile.menu.votes,
      icon: 'images/decision-open.png',
      iconActivated: 'images/decision-open-active.png',
      feed: 'all',
      separator: false,
      url: '/',
      selected: _verifySelection('all', feed)
    },
    {
      id: 2,
      label: TAPi18n.__('approved'),
      icon: 'images/decision-approved.png',
      iconActivated: 'images/decision-approved-active.png',
      feed: 'approved',
      value: 0,
      separator: false,
      url: '/filter?stage=approved',
      selected: _verifySelection('approved', feed)
    },
    {
      id: 3,
      label: TAPi18n.__('closed'),
      icon: 'images/decision-closed.png',
      iconActivated: 'images/decision-closed-active.png',
      feed: 'closed',
      value: 0,
      separator: false,
      url: '/filter?stage=closed',
      selected: _verifySelection('closed', feed)
    },
    {
      id: 4,
      label: TAPi18n.__('drafts'),
      icon: 'images/decision-draft.png',
      iconActivated: 'images/decision-draft-active.png',
      feed: 'draft',
      value: Meteor.user().profile.menu.drafts,
      separator: false,
      url: '/filter?stage=draft',
      selected: _verifySelection('draft', feed)
    }
  );

  return menu;

}

let _getPersonalMenu = (feed) => {
  var menu = new Array();

  menu.push(
    {
      id: 6,
      label: TAPi18n.__('proposals'),
      icon: 'images/decision-proposals.png',
      iconActivated: 'images/decision-proposals-active.png',
      feed: 'proposals',
      value: Meteor.user().profile.menu.drafts,
      separator: false,
      url: '/filter?kind=vote&id=',
      selected: _verifySelection('proposals', feed)
    },
    {
      id: 7,
      label: TAPi18n.__('voted-issues'),
      icon: 'images/decision-vote.png',
      iconActivated: 'images/decision-vote-active.png',
      feed: 'voted',
      value: Meteor.user().profile.menu.drafts,
      separator: false,
      url: '/filter?kind=vote&id=',
      selected: _verifySelection('voted', feed)
    }
  );

  return menu;

}

let _verifySelection = (selection, feed) => {
  if (selection == feed) {

    //Empty content if void
    Session.set('emptyContent', {
      label: TAPi18n.__('empty-feed-label-' + feed),
      detail: TAPi18n.__('empty-feed-detail-' + feed),
      contribute: TAPi18n.__('empty-feed-contribute-' + feed),
      url: '/vote/draft?kind=' + feed
    });

    return true;
  } else {
    return false;
  }
}

let animateMenu = () => {
  //TODO make all strings showing pixels compliant with the device screen being used (aka mobiles)
  Session.set('sidebar', !Session.get('sidebar'));
  if (Session.get('sidebar')) {
    $('#menu').velocity({'marginLeft': '0px'}, Modules.client.animationSettings);
    $('#content').velocity({'left': '320px'}, Modules.client.animationSettings);
    $('.navbar').velocity({'left': '320px'}, Modules.client.animationSettings);
  } else {
    $('#menu').velocity({'marginLeft': '-320px'}, Modules.client.animationSettings);
    $('#content').velocity({'left': '0px'}, Modules.client.animationSettings);
    $('.navbar').velocity({'left': '0px'}, Modules.client.animationSettings);
  }
}

Modules.client.toggleSidebar = animateMenu;
Modules.client.setSidebarMenu = sidebarMenu;
