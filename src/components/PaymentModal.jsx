import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, tripDetails, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Payment method, 2: Payment details, 3: Processing, 4: Success
  const [errors, setErrors] = useState({});
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentType, setPaymentType] = useState('advance'); // 'advance' or 'full'

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPaymentMethod('card');
      setCardDetails({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      });
      setUpiId('');
      setErrors({});
      setPaymentType('advance');
      
      // Calculate payment amount based on trip details
      if (tripDetails) {
        const advanceAmount = Math.round(tripDetails.totalAmount * 0.3); // 30% advance
        setPaymentAmount(advanceAmount);
      }
    }
  }, [isOpen, tripDetails]);

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    if (value.length <= 19) { // 16 digits + 3 spaces
      setCardDetails(prev => ({ ...prev, cardNumber: value }));
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    if (value.length <= 5) {
      setCardDetails(prev => ({ ...prev, expiryDate: value }));
    }
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setCardDetails(prev => ({ ...prev, cvv: value }));
    }
  };

  // Validation functions
  const validateCardNumber = (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  const validateExpiryDate = (expiryDate) => {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiryDate)) return false;
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year) + 2000;
    const expMonth = parseInt(month);
    
    if (expYear < currentDate.getFullYear()) return false;
    if (expYear === currentDate.getFullYear() && expMonth < currentMonth) return false;
    
    return true;
  };

  const validateCvv = (cvv) => {
    return /^\d{3}$/.test(cvv);
  };

  const validateCardholderName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
  };

  const validateUpiId = (upiId) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    const phoneRegex = /^\d{10}@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId) || phoneRegex.test(upiId);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (paymentMethod === 'card') {
      if (!validateCardNumber(cardDetails.cardNumber)) {
        newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      if (!validateExpiryDate(cardDetails.expiryDate)) {
        newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
      }
      if (!validateCvv(cardDetails.cvv)) {
        newErrors.cvv = 'Please enter a valid 3-digit CVV';
      }
      if (!validateCardholderName(cardDetails.cardholderName)) {
        newErrors.cardholderName = 'Please enter a valid cardholder name';
      }
    } else if (paymentMethod === 'upi') {
      if (!validateUpiId(upiId)) {
        newErrors.upiId = 'Please enter a valid UPI ID (e.g., name@paytm or 9876543210@upi)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before proceeding');
      return;
    }

    setStep(3);
    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setStep(4);
      
      // Simulate success after 2 seconds
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 2000);
    }, 3000);
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    if (tripDetails) {
      if (type === 'advance') {
        const advanceAmount = Math.round(tripDetails.totalAmount * 0.3); // 30% advance
        setPaymentAmount(advanceAmount);
      } else {
        setPaymentAmount(tripDetails.totalAmount);
      }
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-yellow-500">Payment Gateway</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-400 text-2xl"
          >
            ×
          </button>
        </div>

          {/* Trip Details */}
        {tripDetails && (
          <div className="p-6 bg-gray-800 border-b">
            <h3 className="font-medium text-yellow-500 mb-3">Trip Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Route:</span>
                <span className="font-medium">{tripDetails.route}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Dates:</span>
                <span className="font-medium">{tripDetails.dates}</span>
            </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Distance:</span>
                <span className="font-medium">{tripDetails.distance} km</span>
          </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Amount:</span>
                <span className="font-medium">{formatAmount(tripDetails.totalAmount)}</span>
              </div>
            </div>
            
            {/* Payment Type Selection */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-yellow-500 mb-3">Payment Options</h4>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                  <input
                    type="radio"
                    name="paymentType"
                    value="advance"
                    checked={paymentType === 'advance'}
                    onChange={(e) => handlePaymentTypeChange(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Pay Advance (30%)</div>
                    <div className="text-sm text-gray-400">
                      Pay {formatAmount(Math.round(tripDetails.totalAmount * 0.3))} now, 
                      remaining {formatAmount(Math.round(tripDetails.totalAmount * 0.7))} on trip completion
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50">
                  <input
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={paymentType === 'full'}
                    onChange={(e) => handlePaymentTypeChange(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Pay Full Amount</div>
                    <div className="text-sm text-gray-400">
                      Pay complete {formatAmount(tripDetails.totalAmount)} now
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-yellow-500">Amount to Pay:</span>
                  <span className="text-xl font-bold text-blue-600">{formatAmount(paymentAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Steps */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-yellow-500 mb-4">Choose Payment Method</h3>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-800">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <div className="w-8 h-6 bg-blue-600 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">💳</span>
                    </div>
                    <div>
                      <div className="font-medium">Credit/Debit Card</div>
                      <div className="text-sm text-gray-400">Visa, Mastercard, RuPay</div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-800">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <div className="w-8 h-6 bg-purple-600 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">UPI</span>
                    </div>
                    <div>
                      <div className="font-medium">UPI Payment</div>
                      <div className="text-sm text-gray-400">Google Pay, PhonePe, Paytm</div>
                    </div>
                  </div>
                </label>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-yellow-500">Payment Details</h3>
            <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
            >
                  ← Back
            </button>
              </div>

              {paymentMethod === 'card' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.cardNumber ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                    {errors.cardNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardholderName}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                      placeholder="John Doe"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.cardholderName ? 'border-red-500' : 'border-gray-600'
                      }`}
                    />
                    {errors.cardholderName && (
                      <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.expiryDate ? 'border-red-500' : 'border-gray-600'
                        }`}
                      />
                      {errors.expiryDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={handleCvvChange}
                        placeholder="123"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cvv ? 'border-red-500' : 'border-gray-600'
                        }`}
                      />
                      {errors.cvv && (
                        <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@paytm or 9876543210@upi"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.upiId ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.upiId && (
                    <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Enter your UPI ID to receive payment request
                  </p>
                </div>
              )}

              <button
                onClick={handlePayment}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Pay {formatAmount(paymentAmount)}
              </button>
          </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-lg font-medium text-yellow-500 mb-2">Processing Payment</h3>
              <p className="text-gray-400">Please wait while we process your payment...</p>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="inline-block w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-yellow-500 mb-2">Payment Successful!</h3>
              <p className="text-gray-400">Your trip has been confirmed. You will receive a confirmation email shortly.</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        {step < 3 && (
          <div className="px-6 pb-4">
            <div className="flex items-center text-xs text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Your payment is secured with 256-bit SSL encryption
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;