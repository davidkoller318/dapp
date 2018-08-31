import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';
import { Counts } from 'meteor/tmeasday:publish-counts';

import { query } from '/lib/views';
import { here } from '/lib/utils';
import { Contracts } from '/imports/api/contracts/Contracts';
import { createContract } from '/imports/startup/both/modules/Contract';
import { toggleSidebar } from '/imports/ui/modules/menu';

import '/imports/ui/templates/widgets/feed/feed.html';
import '/imports/ui/templates/widgets/feed/feedItem.js';
import '/imports/ui/templates/widgets/feed/feedEmpty.js';
import '/imports/ui/templates/widgets/feed/feedLoad.js';

const _parentDepth = (replyId, list) => {
  const feed = list;
  for (let i = 0; i < feed.length; i += 1) {
    if (feed[i]._id === replyId) {
      if (feed[i].depth) {
        return feed[i].depth;
      }
      return _setDepth(feed[i].replyId, feed, i);
    }
  }
  return undefined;
};

const _setDepth = (replyId, list, index) => {
  const feed = list;
  if (!replyId) {
    return 0;
  } else if (replyId === feed[0]._id) {
    return 1;
  }
  return _parentDepth(feed[index].replyId, feed) + 1;
};

const _indexOfReply = (list, replyId) => {
  const feed = list;
  for (let i = 0; i < feed.length; i += 1) {
    if (feed[i]._id === replyId) {
      return i;
    }
  }
  return undefined;
};

function move(arr, old_index, new_index) {
  while (old_index < 0) {
    old_index += arr.length;
  }
  while (new_index < 0) {
    new_index += arr.length;
  }
  if (new_index >= arr.length) {
    var k = new_index - arr.length;
    while ((k--) + 1) {
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr;
}

const _feedDepth = (list) => {
  let feed = list;
  for (let i = 0; i < feed.length; i += 1) {
    feed[i].depth = _setDepth(feed[i].replyId, feed, i);
  }
  feed = _.sortBy(feed, 'depth');
  let childPos;
  let cache;
  let newFeed = feed;
  let children = [];
  console.log('SORTER');
  for (let j = 0; j < feed.length; j += 1) {
    console.log(`keyword: ${feed[j].title} depth: ${feed[j].depth}`);
    console.log(`replies: ${feed[j].totalReplies}`);
    children = [];
    if ((feed[j].totalReplies > 0) && feed[j].depth > 0) {
      for (let k = 0; k < feed.length; k += 1) {
        if (feed[j]._id === feed[k].replyId) {
          children.push(feed[k]);
        }
      }
      console.log(`children of the revolution:`);
      console.log(children);
    }
    if (children.length > 0) {
      console.log(`inserting at ${parseInt(j + 1, 10)}`);
      for (let m = 0; m < newFeed.length; m += 1) {
        for (let l = 0; l < children.length; l += 1) {
          if (newFeed[m]._id === children[l]._id) {
            newFeed.splice(m, 1);
          }
        }
      }
      newFeed.splice(parseInt(j + 1, 10), 0, ...children);
    }
    console.log('result:');
    for (const n in newFeed) {
      console.log(`newFeed '${newFeed[n].keyword}'`);
    }
  }
  return newFeed;
};

Template.feed.onCreated(function () {
  Template.instance().count = new ReactiveVar(0);
  Template.instance().feed = new ReactiveVar();
  Template.currentData().refresh = false;

  const instance = this;

  if ((Meteor.Device.isPhone() && Session.get('sidebar')) || (Session.get('miniWindow') && Session.get('sidebar'))) {
    toggleSidebar(false);
  }

  // tailor feed to show a specific kind of post
  if (Template.currentData().kind) {
    Template.currentData().options.kind = Template.currentData().kind;
  }

  this.subscription = instance.subscribe('feed', Template.currentData().options);
  const parameters = query(Template.currentData().options);

  // verify if beginning
  const beginning = ((Template.currentData().options.skip === 0) && !instance.feed.get());
  if (beginning) { $('.right').scrollTop(0); }
  instance.data.refresh = beginning;

  const dbQuery = Contracts.find(parameters.find, parameters.options);
  this.handle = dbQuery.observeChanges({
    changed: () => {
      // TODO: be reactive please
      // displayNotice(TAPi18n.__('notify-new-posts'), true);
    },
    addedBefore: (id, fields) => {
      // added stuff
      const currentFeed = instance.feed.get();
      const post = fields;
      post._id = id;
      if (instance.data.displayActions) {
        post.displayActions = true;
      }
      if (!(instance.data.noReplies && post.replyId)) {
        if (!currentFeed) {
          instance.feed.set([post]);
          instance.data.refresh = false;
        } else if (!here(post, currentFeed)) {
          currentFeed.push(post);
          instance.feed.set(_.uniq(currentFeed));
        }
      }
    },
  });
});

Template.feed.onRendered(function () {
  const instance = this;
  instance.autorun(function () {
    const count = instance.subscribe('feedCount', Template.currentData().options);

    // total items on the feed
    if (count.ready()) {
      instance.count.set(Counts.get('feedItems'));
    }
  });
});

Template.feed.onDestroyed(function () {
  this.handle.stop();
  this.subscription.stop();
});

Template.feed.helpers({
  item() {
    let feed = Template.instance().feed.get();

    if (this.options.view === 'lastVotes' || this.options.view === 'latest' || this.mainPost === true) {
      // general view
      for (let i = 0; i <= (feed.length - 1); i += 1) {
        feed[i].mainFeed = true;
      }
    } else {
      // thread view
      feed = _.sortBy(feed, 'createdAt');
      feed = _feedDepth(feed);
      for (let i = 0; i <= (feed.length - 1); i += 1) {
        feed[i].mainFeed = false;
        if (i === (feed.length - 1)) {
          feed[i].lastItem = true;
        } else {
          feed[i].lastItem = false;
        }
        if (i !== 0) {
          feed[i].previousItem = feed[i - 1]._id;
        }
      }
    }
    return feed; // Template.instance().feed.get();
  },
  empty() {
    if (Session.get('showPostEditor')) {
      return false;
    }
    if (Template.instance().feed.get()) {
      return (Template.instance().feed.get().length === 0);
    }
    return (!Template.instance().feed.get());
  },
  refresh() {
    return Template.currentData().refresh;
  },
  beginning() {
    return (Template.currentData().options.skip === 0 || Template.currentData().singlePost);
  },
  single() {
    return Template.currentData().singlePost;
  },
  emptyContent() {
    return Session.get('emptyContent');
  },
  count() {
    return Template.instance().count.get();
  },
  placeholderItem() {
    if (Template.currentData().singlePost) {
      return [1];
    }
    return [1, 2, 3, 4, 5];
  },
});
