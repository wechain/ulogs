import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Input } from 'antd';
import _ from 'lodash';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import Action from '../components/Button/Action';
import SteemConnect from '../steemConnectAPI';
import { getAuthenticatedUser } from '../reducers';
import './Transfer.less';

const InputGroup = Input.Group;

@injectIntl
@Form.create()
@connect(state => ({
  user: getAuthenticatedUser(state),
}))
class PowerUpButton extends React.Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
  };

  static amountRegex = /^[0-9]*\.?[0-9]{0,3}$/;

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
    // SteemConnect.sign('profile-update', cleanValues);
  }

  hideModal() {
    this.setState({
      displayModal: false,
    });
  }

  handleContinueClick() {
    const { form, user } = this.props;
    form.validateFields({ force: true }, (errors, values) => {
      if (!errors) {
        const transferQuery = {
          to: user.name,
          amount: values.amount,
        };

        if (values.memo) transferQuery.memo = values.memo;

        const win = window.open(SteemConnect.sign('transfer_to_vesting', transferQuery), '_blank');
        win.focus();
        this.hideModal();
      }
    });
  }

  handleBalanceClick(event) {
    const { oldAmount } = this.state;
    const value = parseFloat(event.currentTarget.innerText);
    this.setState({
      amount: PowerUpButton.amountRegex.test(value) ? value : oldAmount,
    });
    this.props.form.setFieldsValue({
      amount: value,
    });
  }

  handleAmountChange(event) {
    const { value } = event.target;
    const { amount } = this.state;

    this.setState({
      amount: PowerUpButton.amountRegex.test(value) ? value : amount,
    });
    this.props.form.setFieldsValue({
      amount: PowerUpButton.amountRegex.test(value) ? value : amount,
    });
    this.props.form.validateFields(['amount']);
  }

  render() {
    const { intl, form, user } = this.props;
    const { getFieldDecorator } = form;
    const { displayModal, usdValue } = this.state;
    const balance = _.get(user, 'balance', 0);

    return (
      <div>
        <Action primary text="Power up" onClick={this.displayModal} />
        {displayModal && (
          <Modal
            visible={displayModal}
            title="Power up"
            okText={intl.formatMessage({ id: 'power_up', defaultMessage: 'Power up' })}
            cancelText={intl.formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
            onOk={this.handleContinueClick}
            onCancel={this.hideModal}
            destroyOnClose
          >
            <Form className="Transfer" hideRequiredMark>
              <Form.Item label={<FormattedMessage id="amount" defaultMessage="Amount" />}>
                <InputGroup className="Transfer__amount">
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
                        pattern: PowerUpButton.amountRegex,
                        message: intl.formatMessage({
                          id: 'amount_error_format',
                          defaultMessage:
                            'Incorrect format. Use comma or dot as decimal separator. Use at most 3 decimal places.',
                        }),
                      },
                      { validator: this.validateBalance },
                    ],
                  })(
                    <Input
                      className="Transfer__amount__input"
                      onChange={this.handleAmountChange}
                      placeholder={intl.formatMessage({
                        id: 'amount_placeholder',
                        defaultMessage: 'How much do you want to send',
                      })}
                    />,
                  )}
                  <Input className="Transfer__usd-value" placeholder={usdValue} />
                </InputGroup>
                <FormattedMessage
                  id="balance_amount"
                  defaultMessage="Your balance: {amount}"
                  values={{
                    amount: (
                      <span
                        role="presentation"
                        onClick={this.handleBalanceClick}
                        className="balance"
                      >
                        {balance}
                      </span>
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

export default PowerUpButton;
