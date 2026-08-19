import { redirect } from "next/navigation";

// /masters로 바로 들어오면 첫 번째로 구현된 탭(법인)으로 보낸다.
export default function MastersIndexPage() {
  redirect("/masters/corporations");
}
