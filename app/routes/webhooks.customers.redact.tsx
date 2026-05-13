import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} for ${shop}`);

  // This app focuses on store-level delivery rules and does not store 
  // personally identifiable information (PII) for individual customers.
  return new Response();
};
