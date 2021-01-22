/*
 A singleton class to store customers and their wallets.
 Customers are stored in the 'customers' property as an object. They keys of the object are user ids and the values
 are objects with 'btc' and 'gold' keys. The unit of gold is gram.
 customers = {
    1: { btc: 36, gold: 12 },
    2: { btc: 18, gold: 39 },
    3: { btc: 123, gold: 65 },
 }
*/
import checkCustomerIdValid from './utils.js';

export default class CustomersStore {
  constructor() {
    if (CustomersStore._instance) {
      return CustomersStore._instance;
    }
    CustomersStore._instance = this;
    this.customers = {};
  }
  addCustomer(customerId) {
    // Creates a customer and adds it to the customers property.
    checkCustomerIdValid(customerId);
    if (this.customers[customerId]) throw 'Customer already exists!';

    this.customers[customerId] = { btc: 0, gold: 0 };
  }
  getCustomer(customerId){
    this.checkCustomerExists(customerId);
    return this.customers[customerId];
  }

  checkCustomerExists(customerId){
    if (!this.customers[customerId]) throw 'Customer does not exist!';
  }
  changeDeposit(customerId, btc, gold) {
    // increase or decrease deposit by passing positive or negative btc or gold
    // the unit of gold is grams
    this.checkCustomerExists(customerId);
    if ((this.customers[customerId]['btc'] + btc) < 0 ) {
      throw 'Cannot make btc deposit negative!'
    }
    if ((this.customers[customerId]['gold'] + gold) < 0 ) {
      throw 'Cannot make gold deposit negative!'
    }
    this.customers[customerId]['btc'] += btc;
    this.customers[customerId]['gold'] += gold;
  }
}