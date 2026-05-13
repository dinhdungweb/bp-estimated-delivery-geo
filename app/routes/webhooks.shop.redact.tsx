import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} for ${shop}`);

  // When a shop is redacted, we should ensure all its data is removed.
  // The app/uninstalled webhook already handles session deletion, but
  // we can explicitly clean up other related tables here if needed.
  if (shop) {
    await db.appSetting.deleteMany({ where: { shop } });
    await db.deliveryRule.deleteMany({ where: { shop } });
    await db.widget.deleteMany({ where: { shop } });
    await db.analyticsEvent.deleteMany({ where: { shop } });
  }

  return new Response();
};
