import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} for ${shop}`);
  
  // As this app doesn't store customer data in a way that requires individual
  // retrieval for GDPR, we can simply acknowledge the request.
  return new Response(null, { status: 200 });
};
