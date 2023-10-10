import { NextApiRequest, NextApiResponse } from 'next';
import { bigcommerceClient } from '../../lib/auth';

const { 
    STORE_HASH,
    ACCESS_TOKEN,
    WHITE_LIST
} = process.env;

export default async (req: NextApiRequest, res: NextApiResponse) => {

    const origin = req.headers.origin;

    if(!WHITE_LIST.includes(origin) && origin !== undefined) {
        return res.status(401).json({ message: 'Unauthorized' });
    }


    const {
        query: { orderId },
        method,
    } = req;


    try {

        const bigcommerce = bigcommerceClient(STORE_HASH, ACCESS_TOKEN, 'v2');
        console.log('accessToken', ACCESS_TOKEN)
        // Set the CORS headers
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, PATCH, DELETE, POST, PUT');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      

        switch (method) {
            case 'GET': {
                const data = await bigcommerce.get(`/orders/${orderId}`);

                res.status(200).json(data);

                break;
            }
        
            default: {
                res.setHeader('Allow', ['GET']);
                res.status(405).end(`Method ${method} Not Allowed`);
            }
        }
        
    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }

};
