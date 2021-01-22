/*
  A class that keeps buying orders and selling orders in two different queues. Also, it performs buying and selling
  operations.
  The keys of buyingOrdersQueue and sellingOrdersQueue objects are prices ordered for buying and selling. The values
  are arrays that keep buying and selling  queues. For example, the gold selling orders of 2 btcs and 3 btcs can be modelled as:
  sellingOrdersQueue = {
     '2': [ { customerId: 2, amount: 15 },  { customerId: 1, amount: 12 }],
     '3': [ { customerId: 4, amount: 1 },  { customerId: 2, amount: 11 }],
  }
*/

import CustomersStore from './customers_store.js'
import {checkOrderPriceValid} from './utils.js';

export default class Order{
  constructor() {
    this.buyingOrdersQueue = {};
    this.sellingOrdersQueue = {};
  }
  getBuyingQueue(){
    return this.buyingOrdersQueue;
  }
  getSellingQueue(){
    return this.sellingOrdersQueue;
  }

  checkCustomerHasOrderInQueue(customerId, queue){
    // queue parameter is buyingOrdersQueue or sellingOrdersQueue
    // This function checks if the customer has any orders in buyingOrdersQueue or sellingOrdersQueue
    let totalBtcInQueue = 0;
    let totalGoldAmountInQueue = 0;

    for (const [price, priceQueue] of Object.entries(queue)) {
      const ordersOfSingleCustomer = priceQueue.filter(customerOrder=> {
        return customerOrder['customerId'] === customerId;
      });

      if(ordersOfSingleCustomer.length !== 0){
        for (const order of ordersOfSingleCustomer){
          totalGoldAmountInQueue += order['amount'];
          totalBtcInQueue += (order['amount']*price);
        }
      }
    }
    return {
      totalBtcInQueue: totalBtcInQueue,
      totalGoldAmountInQueue: totalGoldAmountInQueue
    };
  }

  buyGold(buyerCustomerId, goldAmountToBuy, orderPriceInBtc) {
    // unit of goldAmountToBuy is gram.
    // goldPriceToBuy is the unit price of the order and it is in btc.
    checkOrderPriceValid(goldAmountToBuy);
    checkOrderPriceValid(orderPriceInBtc);

    const customersStore = new CustomersStore();
    const buyerCustomer = customersStore.getCustomer(buyerCustomerId);
    const totalBtcInBuyOrder = this.checkCustomerHasOrderInQueue(buyerCustomerId, this.buyingOrdersQueue)['totalBtcInQueue'];
    const usableBtc = buyerCustomer['btc'] - totalBtcInBuyOrder;
    const orderTotal = goldAmountToBuy*orderPriceInBtc;

    if((goldAmountToBuy*orderPriceInBtc) > usableBtc){
      throw `You don't have ${orderTotal} btcs available for buy order. You only have ${usableBtc} btcs`;
    }

    // If there is no any sellings for orderPriceInBtc in this.sellingQueue, add the order to buying queue.
    if (!(orderPriceInBtc in this.sellingOrdersQueue)){
      if (!(orderPriceInBtc in this.buyingOrdersQueue)) this.buyingOrdersQueue[orderPriceInBtc] = [];
      this.buyingOrdersQueue[orderPriceInBtc].unshift({customerId: buyerCustomerId, amount: goldAmountToBuy});
    }

    else {
      const _sellingQueue = this.sellingOrdersQueue;

      for (let i = _sellingQueue[orderPriceInBtc].length - 1; i >= 0; i--) {
        const sellOrder = _sellingQueue[orderPriceInBtc][i];
        const sellerCustomerId = sellOrder['customerId'];
        const sellAmount = sellOrder['amount'];

        if (sellAmount === goldAmountToBuy) {
          this.sellingOrdersQueue[orderPriceInBtc].splice(i, 1);
          if (this.sellingOrdersQueue[orderPriceInBtc].length === 0){
            delete this.sellingOrdersQueue[orderPriceInBtc]
          }
          customersStore.changeDeposit(sellerCustomerId, goldAmountToBuy*orderPriceInBtc, -1*goldAmountToBuy);
          customersStore.changeDeposit(buyerCustomerId, -1*goldAmountToBuy*orderPriceInBtc, goldAmountToBuy );
          goldAmountToBuy -= sellAmount;
          break;
        }

        else if (sellAmount > goldAmountToBuy) {
          const remainingSellAfterBuying = {customerId: sellerCustomerId, amount: sellAmount-goldAmountToBuy};
          this.sellingOrdersQueue[orderPriceInBtc][i] = remainingSellAfterBuying;
          customersStore.changeDeposit(sellerCustomerId, goldAmountToBuy*orderPriceInBtc, -1*goldAmountToBuy);
          customersStore.changeDeposit(buyerCustomerId, -1*goldAmountToBuy*orderPriceInBtc, goldAmountToBuy);
          goldAmountToBuy -= sellAmount;
          break;
        }

        else if (sellAmount < goldAmountToBuy){
          this.sellingOrdersQueue[orderPriceInBtc].splice(i, 1);
          customersStore.changeDeposit(sellerCustomerId, sellAmount*orderPriceInBtc, -1*sellAmount);
          customersStore.changeDeposit(buyerCustomerId, -1*sellAmount*orderPriceInBtc, sellAmount);
          goldAmountToBuy -= sellAmount;
        }
      }

      // If there is still remaining of goldAmountToBuy after buying from the queue, add it to the buyingOrdersQueue
      if (goldAmountToBuy > 0){
        if (!(orderPriceInBtc in this.buyingOrdersQueue)) this.buyingOrdersQueue[orderPriceInBtc] = [];
        this.buyingOrdersQueue[orderPriceInBtc].unshift({customerId: buyerCustomerId, amount: goldAmountToBuy});
      }
    }
  }

  sellGold(sellerCustomerId, goldAmountToSell, orderPriceInBtc) {
    checkOrderPriceValid(goldAmountToSell);
    checkOrderPriceValid(orderPriceInBtc);

    const customersStore = new CustomersStore();
    const sellerCustomer = customersStore.getCustomer(sellerCustomerId);
    const totalGoldInSellOrder = this.checkCustomerHasOrderInQueue(sellerCustomerId, this.sellingOrdersQueue)['totalGoldAmountInQueue'];
    const usableGold = sellerCustomer['gold'] - totalGoldInSellOrder;

    if(goldAmountToSell > usableGold){
      throw `You don't have ${goldAmountToSell} grams of gold available for sell order. You only have ${usableGold} gr golds`;
    }

    // If there is no any buyings for orderPriceInBtc in this.buyingQueue, add the order to sellingQueue.
    if (!(orderPriceInBtc in this.buyingOrdersQueue)){
      if (!(orderPriceInBtc in this.sellingOrdersQueue)) this.sellingOrdersQueue[orderPriceInBtc] = [];
      this.sellingOrdersQueue[orderPriceInBtc].unshift({customerId: sellerCustomerId, amount: goldAmountToSell});
    }

    else {
      const _buyingQueue = this.buyingOrdersQueue;

      for (let i = _buyingQueue[orderPriceInBtc].length - 1; i >= 0; i--) {
        const buyOrder = _buyingQueue[orderPriceInBtc][i];
        const buyerCustomerId = buyOrder['customerId'];
        const buyAmount = buyOrder['amount'];

        if (buyAmount === goldAmountToSell) {
          this.buyingOrdersQueue[orderPriceInBtc].splice(i, 1);
          if (this.buyingOrdersQueue[orderPriceInBtc].length === 0){
            delete this.buyingOrdersQueue[orderPriceInBtc]
          }

          customersStore.changeDeposit(sellerCustomerId, goldAmountToSell*orderPriceInBtc, -1*goldAmountToSell);
          customersStore.changeDeposit(buyerCustomerId, -1*goldAmountToSell*orderPriceInBtc, goldAmountToSell );
          goldAmountToSell -= buyAmount;
          break;
        }

        else if (buyAmount > goldAmountToSell) {
          const remainingBuyAfterSelling = {customerId: buyerCustomerId, amount: buyAmount-goldAmountToSell};
          this.buyingOrdersQueue[orderPriceInBtc][i] = remainingBuyAfterSelling;
          customersStore.changeDeposit(sellerCustomerId, goldAmountToSell*orderPriceInBtc, -1*goldAmountToSell);
          customersStore.changeDeposit(buyerCustomerId, -1*goldAmountToSell*orderPriceInBtc, goldAmountToSell);
          goldAmountToSell -= buyAmount;
          break;
        }

        else if (buyAmount < goldAmountToSell){
          this.buyingOrdersQueue[orderPriceInBtc].splice(i, 1);
          customersStore.changeDeposit(sellerCustomerId, buyAmount*orderPriceInBtc, -1*buyAmount);
          customersStore.changeDeposit(buyerCustomerId, -1*buyAmount*orderPriceInBtc, buyAmount);
          goldAmountToSell -= buyAmount;
        }
      }

      // If there is still remaining of goldAmountToSell after selling from the queue, add it to the sellingQueue
      if (goldAmountToSell > 0){
        if (!(orderPriceInBtc in this.sellingOrdersQueue)) this.sellingOrdersQueue[orderPriceInBtc] = [];
        this.sellingOrdersQueue[orderPriceInBtc].unshift({customerId: sellerCustomerId, amount: goldAmountToSell});
      }
    }
  }

  }
