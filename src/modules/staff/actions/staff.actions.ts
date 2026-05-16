"use server";

import { revalidatePath } from "next/cache";
import { GetStaffService } from "../services/get-staff.service";
import { CreateStaffService, CreateStaffDTO } from "../services/create-staff.service";
import { UpdateStaffService, UpdateStaffDTO } from "../services/update-staff.service";
import { DeleteStaffService } from "../services/delete-staff.service";

export async function getStaffAction() {
  try {
    const staff = await GetStaffService.execute();
    return { success: true, data: staff };
  } catch (error: any) {
    console.error("Fetch staff error:", error);
    return { success: false, error: error.message };
  }
}

export async function createStaffAction(data: CreateStaffDTO) {
  try {
    const staff = await CreateStaffService.execute(data);
    revalidatePath("/dashboard/staff");
    return { success: true, data: JSON.parse(JSON.stringify(staff)) };
  } catch (error: any) {
    console.error("Create staff error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateStaffAction(id: string, data: UpdateStaffDTO) {
  try {
    const staff = await UpdateStaffService.execute(id, data);
    revalidatePath("/dashboard/staff");
    return { success: true, data: JSON.parse(JSON.stringify(staff)) };
  } catch (error: any) {
    console.error("Update staff error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteStaffAction(id: string) {
  try {
    await DeleteStaffService.execute(id);
    revalidatePath("/dashboard/staff");
    return { success: true };
  } catch (error: any) {
    console.error("Delete staff error:", error);
    return { success: false, error: error.message };
  }
}
