"use server";

import { revalidatePath } from "next/cache";

export async function revalidateWholesalePage() {
  revalidatePath("/wholesale");
}
