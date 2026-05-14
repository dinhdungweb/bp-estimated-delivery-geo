import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { redactShopData } from "../lib/privacyWebhooks.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} for ${shop}`);

  if (shop) {
    await redactShopData(shop);
  }

  return new Response(null, { status: 200 });
};
