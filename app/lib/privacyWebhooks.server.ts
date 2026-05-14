import db from "../db.server";

export async function redactShopData(shop: string) {
  await db.$transaction([
    db.deliveryRule.deleteMany({ where: { shop } }),
    db.widget.deleteMany({ where: { shop } }),
    db.appSetting.deleteMany({ where: { shop } }),
    db.analyticsEvent.deleteMany({ where: { shop } }),
    db.session.deleteMany({ where: { shop } }),
  ]);
}
