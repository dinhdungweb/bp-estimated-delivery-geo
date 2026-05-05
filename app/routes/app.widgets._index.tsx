import { redirect } from "react-router";

export const loader = async () => redirect("/app/templates?tab=my-design");
export const action = async () => redirect("/app/templates?tab=my-design");

export default function RemovedWidgetsPage() {
  return null;
}
