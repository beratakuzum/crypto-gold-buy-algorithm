import CustomersStore from './customers_store.js'
import Order from './order.js'

const customersStore = new CustomersStore();

// We first add two customers to our customers store to perform buying and selling operations. The initial btc and gold
// amounts in wallets are 0 when customers created.
customersStore.addCustomer(1);
customersStore.addCustomer(2);

// We start off the process by depositing gold and btc to customers' wallets
customersStore.changeDeposit(1,200,30);
customersStore.changeDeposit(2,50,60);

// We create an Order class to enqueue the buying and selling orders and to perform buying and selling operations
const order = new Order();

order.buyGold(1, 10, 3);
order.sellGold(2,10,3);
order.buyGold(1,15,3);
order.sellGold(2,30,3);

console.log("customer1: ", customersStore.getCustomer(1));
console.log("customer2: ", customersStore.getCustomer(2));

console.log("buying queue: ", order.getBuyingQueue());
console.log("selling queue: ", order.getSellingQueue());
