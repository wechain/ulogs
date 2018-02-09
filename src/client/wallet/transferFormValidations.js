import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import steemAPI from '../steemAPI';
import {
  getAuthenticatedUser,
  getIsAuthenticated,
  getTotalVestingFundSteem,
  getTotalVestingShares,
} from '../reducers';
import formatter from '../helpers/steemitFormatter';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
export default function transferFormValidations(WrappedComponent) {
  @injectIntl
  @connect(state => ({
    user: getAuthenticatedUser(state),
    authenticated: getIsAuthenticated(state),
    totalVestingShares: getTotalVestingShares(state),
    totalVestingFundSteem: getTotalVestingFundSteem(state),
  }))
  class Wrapper extends React.Component {
    static propTypes = {
      intl: PropTypes.shape(),
      user: PropTypes.shape(),
      authenticated: PropTypes.bool,
      totalVestingShares: PropTypes.string,
      totalVestingFundSteem: PropTypes.string,
    };

    static defaultProps = {
      intl: {},
      user: {},
      authenticated: false,
      totalVestingShares: '',
      totalVestingFundSteem: '',
    };

    constructor(props) {
      super(props);

      this.state = {
        displayLoginModal: false,
      };

      this.amountRegex = /^[0-9]*\.?[0-9]{0,3}$/;
      this.minAccountLength = 3;
      this.maxAccountLength = 16;

      this.validateUsername = this.validateUsername.bind(this);
      this.validateSPBalance = this.validateSPBalance.bind(this);
      this.validateSteemBalance = this.validateSteemBalance.bind(this);
      this.validateBalance = this.validateBalance.bind(this);
    }

    validateSPBalance(rule, value, callback) {
      const { user, totalVestingShares, totalVestingFundSteem } = this.props;
      const steemPower = parseFloat(
        formatter.vestToSteem(user.vesting_shares, totalVestingShares, totalVestingFundSteem),
      );
      this.validateBalance(rule, value, callback, steemPower);
    }

    validateSteemBalance(rule, value, callback) {
      const { user } = this.props;
      this.validateBalance(rule, value, callback, user.balance);
    }

    validateBalance(rule, value, callback, balance) {
      const { intl, authenticated } = this.props;

      const currentValue = parseFloat(value);

      if (value && currentValue <= 0) {
        callback([
          new Error(
            intl.formatMessage({
              id: 'amount_error_zero',
              defaultMessage: 'Amount has to be higher than 0.',
            }),
          ),
        ]);
        return;
      }

      if (authenticated && currentValue !== 0 && currentValue > parseFloat(balance)) {
        callback([
          new Error(
            intl.formatMessage({ id: 'amount_error_funds', defaultMessage: 'Insufficient funds.' }),
          ),
        ]);
      } else {
        callback();
      }
    }

    validateUsername(rule, value, callback) {
      const { intl } = this.props;

      if (!value) {
        callback();
        return;
      }

      if (value.length < this.minAccountLength) {
        callback([
          new Error(
            intl.formatMessage(
              {
                id: 'username_too_short',
                defaultMessage: 'Username {username} is too short.',
              },
              {
                username: value,
              },
            ),
          ),
        ]);
        return;
      }
      if (value.length > this.maxAccountLength) {
        callback([
          new Error(
            intl.formatMessage(
              {
                id: 'username_too_long',
                defaultMessage: 'Username {username} is too long.',
              },
              {
                username: value,
              },
            ),
          ),
        ]);
        return;
      }
      steemAPI.sendAsync('get_accounts', [[value]]).then(result => {
        if (result[0]) {
          callback();
        } else {
          callback([
            new Error(
              intl.formatMessage(
                {
                  id: 'to_error_not_found_username',
                  defaultMessage: "Couldn't find user with name {username}.",
                },
                {
                  username: value,
                },
              ),
            ),
          ]);
        }
      });
    }

    render() {
      return (
        <WrappedComponent
          validateUsername={this.validateUsername}
          validateSteemBalance={this.validateSteemBalance}
          validateSPBalance={this.validateSPBalance}
          amountRegex={this.amountRegex}
          {...this.props}
        />
      );
    }
  }

  Wrapper.displayName = `withTransferFormValidations(${getDisplayName(WrappedComponent)})`;

  return Wrapper;
}
