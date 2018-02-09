import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input } from 'antd';
import _ from 'lodash';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import Action from '../components/Button/Action';
import SteemConnect from '../steemConnectAPI';
import { getAuthenticatedUser, getTotalVestingFundSteem, getTotalVestingShares } from '../reducers';
import transferFormValidations from './transferFormValidations';
import formatter from '../helpers/steemitFormatter';
import './WalletAction.less';

@transferFormValidations
@injectIntl
@Form.create()
@connect(state => ({
  user: getAuthenticatedUser(state),
  totalVestingShares: getTotalVestingShares(state),
  totalVestingFundSteem: getTotalVestingFundSteem(state),
}))
class PowerDownButton extends React.Component {
  static propTypes = {
    intl: PropTypes.shape(),
    amountRegex: PropTypes.shape(),
    form: PropTypes.shape(),
    user: PropTypes.shape(),
    totalVestingShares: PropTypes.string,
    totalVestingFundSteem: PropTypes.string,
    validateSPBalance: PropTypes.func,
  };

  static defaultProps = {
    intl: {},
    amountRegex: /^[0-9]*\.?[0-9]{0,3}$/,
    form: {},
    user: {},
    totalVestingShares: '',
    totalVestingFundSteem: '',
    validateSPBalance: () => {},
  };

  constructor(props) {
    super(props);

    this.state = {
      displayModal: false,
      amount: '',
    };

    this.displayModal = this.displayModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.handleContinueClick = this.handleContinueClick.bind(this);
    this.handleBalanceClick = this.handleBalanceClick.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
  }

  displayModal() {
    this.setState({
      displayModal: true,
    });
  }

  hideModal() {
    this.setState({
      displayModal: false,
    });
  }

  handleContinueClick() {
    const { form } = this.props;
    form.validateFields({ force: true }, (errors, values) => {
      if (!errors) {
        const transferQuery = {
          vesting_shares: values.amount,
        };

        if (values.memo) transferQuery.memo = values.memo;

        const win = window.open(SteemConnect.sign('withdraw_vesting', transferQuery), '_blank');
        win.focus();
        this.hideModal();
      }
    });
  }

  handleBalanceClick(event) {
    const { oldAmount } = this.state;
    const value = parseFloat(event.currentTarget.innerText);
    this.setState({
      amount: this.props.amountRegex.test(value) ? value : oldAmount,
    });
    this.props.form.setFieldsValue({
      amount: value,
    });
  }

  handleAmountChange(event) {
    const { value } = event.target;
    const { amount } = this.state;

    this.setState({
      amount: this.props.amountRegex.test(value) ? value : amount,
    });
    this.props.form.setFieldsValue({
      amount: this.props.amountRegex.test(value) ? value : amount,
    });
    this.props.form.validateFields(['amount']);
  }

  render() {
    const { intl, form, user, totalVestingShares, totalVestingFundSteem } = this.props;
    const { getFieldDecorator } = form;
    const { displayModal } = this.state;
    const balance = parseFloat(
      formatter.vestToSteem(user.vesting_shares, totalVestingShares, totalVestingFundSteem),
    ).toFixed(3);

    return (
      <div>
        <Action
          className="WalletAction"
          text={intl.formatMessage({ id: 'power_down', defaultMessage: 'Power down' })}
          onClick={this.displayModal}
        />
        {displayModal && (
          <Modal
            visible={displayModal}
            title={intl.formatMessage({ id: 'power_down', defaultMessage: 'Power down' })}
            okText={intl.formatMessage({ id: 'power_down', defaultMessage: 'Power down' })}
            cancelText={intl.formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
            onOk={this.handleContinueClick}
            onCancel={this.hideModal}
            destroyOnClose
          >
            <Form hideRequiredMark>
              <p>
                <FormattedMessage
                  id="power_down_description"
                  defaultMessage="When you use your steem power to power down, you will receive equal distributions of steem weekly, over a 13 week period."
                />
              </p>
              <Form.Item label={<FormattedMessage id="amount" defaultMessage="Amount" />}>
                {getFieldDecorator('amount', {
                  trigger: '',
                  rules: [
                    {
                      required: true,
                      message: intl.formatMessage({
                        id: 'amount_error_empty',
                        defaultMessage: 'Amount is required.',
                      }),
                    },
                    {
                      pattern: this.props.amountRegex,
                      message: intl.formatMessage({
                        id: 'amount_error_format',
                        defaultMessage:
                          'Incorrect format. Use comma or dot as decimal separator. Use at most 3 decimal places.',
                      }),
                    },
                    { validator: this.props.validateSPBalance },
                  ],
                })(
                  <Input
                    onChange={this.handleAmountChange}
                    placeholder={intl.formatMessage({
                      id: 'amount_placeholder',
                      defaultMessage: 'How much do you want to send',
                    })}
                  />,
                )}
                <FormattedMessage
                  id="balance_amount"
                  defaultMessage="Your balance: {amount}"
                  values={{
                    amount: (
                      <a role="presentation" onClick={this.handleBalanceClick}>
                        {`${balance} SP`}
                      </a>
                    ),
                  }}
                />
              </Form.Item>
            </Form>
          </Modal>
        )}
      </div>
    );
  }
}

export default PowerDownButton;
