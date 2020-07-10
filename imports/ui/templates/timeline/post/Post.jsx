import React, { Component } from 'react';
import PropTypes from 'prop-types';
import parser from 'html-react-parser';
import { TAPi18n } from 'meteor/tap:i18n';

import { wrapURLs } from '/lib/utils';

import Account from '/imports/ui/templates/timeline/account/Account.jsx';
import Stamp from '/imports/ui/templates/timeline/stamp/Stamp.jsx';
import Parameter from '/imports/ui/templates/timeline/parameter/Parameter.jsx';
import Token from '/imports/ui/templates/timeline/token/Token.jsx';

/**
* @summary quick function to determine if a string is a JSON
* @param {string} str ing
*/
const _isJSON = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

/**
* @summary renders a post in the timeline
*/
export default class Post extends Component {
  constructor(props) {
    super(props);

    // content formatting
    if (_isJSON(props.description)) {
      const json = JSON.parse(props.description);

      this.state = {
        title: json.title ? json.title : json,
        description: json.description ? wrapURLs(json.description) : '',
        link: (typeof json.link === 'function' || !json.link) ? '' : json.link,
      };
    } else {
      this.state = {
        title: wrapURLs(props.description),
        description: undefined,
        link: undefined,
      };
    }
  }

  render() {
    return (
      <div id={this.props.id} className="vote vote-search vote-feed nondraggable vote-poll" href={`/dao/${this.props.daoName}/proposal/${this.props.proposalIndex}`}>
        <div className="checkbox checkbox-custom">
          <div className="meta meta-search meta-bar">
            <Account
              id={`avatar-${this.props.memberAddress}`}
              publicAddress={this.props.memberAddress}
              width="24px"
              height="24px"
            />
          </div>
          <div className="option-proposal">
            <div className="option-title option-link option-search title-input">
              <div className="title-input title-feed">
                <div className="title-header">
                  {typeof this.state.title === 'string' ? parser(this.state.title) : this.state.title}
                </div>
                <div className="title-description">
                  {typeof this.state.description === 'string' ? parser(this.state.description) : this.state.description}
                </div>
                {
                  (this.state.link) ?
                    <div className="title-description">
                      <a href={this.state.link} target="_blank" rel="noopener noreferrer">{this.state.link}</a>
                    </div>
                    :
                    null
                }
              </div>
            </div>
          </div>
          <Stamp
            timestamp={this.props.timestamp}
          />
          <div className="smart-contract">
            <Parameter label={TAPi18n.__('moloch-applicant')}>
              <Account
                id={`avatar-${this.props.applicantAddress}`}
                publicAddress={this.props.applicantAddress}
                width="24px"
                height="24px"
              />
            </Parameter>
            <Parameter label={TAPi18n.__('moloch-request')}>
              <Token
                quantity={this.props.sharesRequested.toString()}
                symbol="SHARES"
              />
            </Parameter>
            <Parameter label={TAPi18n.__('moloch-tribute')}>
              <Token
                quantity={this.props.tokenTribute.toString()}
                publicAddress={'0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'}
              />
            </Parameter>
          </div>
        </div>
      </div>
    );
  }
}

Post.propTypes = {
  id: PropTypes.string,
  description: PropTypes.string,
  proposalIndex: PropTypes.string,
  daoName: PropTypes.string,
  memberAddress: PropTypes.string,
  applicantAddress: PropTypes.string,
  timestamp: PropTypes.string,
  sharesRequested: PropTypes.string,
  tokenTribute: PropTypes.string,
};
