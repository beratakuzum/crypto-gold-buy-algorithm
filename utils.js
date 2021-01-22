// utilities for validation

function checkCustomerIdValid(customerId){
  if (!Number.isInteger(customerId) || customerId < 0){
   throw 'Customer id must be a positive integer!!'
  }
}

function checkOrderPriceValid(price) {
  if (!Number.isInteger(price) || price < 0){
    throw 'Order price must be a positive integer!!'
  }
}

export default checkCustomerIdValid;
export {checkOrderPriceValid};
