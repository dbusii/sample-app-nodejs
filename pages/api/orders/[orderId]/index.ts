import { NextApiRequest, NextApiResponse } from 'next';
import { bigcommerceClient } from '../../../../lib/auth';

// Get environment variables
const { 
    STORE_HASH,
    ACCESS_TOKEN,
    WHITE_LIST
} = process.env;

export default async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        
        // Verify the request method is allowed
        if (req.method !== 'GET') {
            res.setHeader('Allow', ['GET']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }

        // Verify the request origin
        const origin = req.headers.origin;
        if(!WHITE_LIST.includes(origin) && origin !== undefined) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    
        // Get the order ID and email from the query string
        const { orderId, email } = req.query;

        // Validate the order ID
        if (isNaN(Number(orderId))) {
            return res.status(400).json({ message: 'Order ID must be a number' });
        }

        // Validate the email address
        const emailValue = Array.isArray(email) ? email[0] : email;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
            return res.status(400).json({ message: 'Email is invalid' });
        }

        // Create a Bigcommerce client
        const bigcommerce = bigcommerceClient(STORE_HASH, ACCESS_TOKEN, 'v2');

        // Fetch order data
        const data = await bigcommerce.get(`/orders/${orderId}`);

        // Verify email
        if (data && data.billing_address && data.billing_address.email !== email) {
            return res.status(400).json({ message: 'Email does not match order' });
        }

        // Set the CORS headers
        if(origin !== undefined){
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        //Return the order data
        const { id, status, date_created } = data;
        const order = { id, status, date_created };
        res.status(200).json(order);
        
    } catch (error) {
        const { message, response } = error;
        console.error('Error:', message); // Log the error for debugging
        res.status(response?.status || 500).json({ message: 'An error occurred' });
    }
};
