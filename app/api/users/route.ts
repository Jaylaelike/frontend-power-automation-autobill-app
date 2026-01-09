import { NextResponse } from "next/server";
import { getUsers, importUsersFromCSV } from "@/lib/users-import";

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await importUsersFromCSV();
    if (result.success) {
      return NextResponse.json({
        message: `Successfully imported ${result.count} users`,
        count: result.count
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to import users" },
      { status: 500 }
    );
  }
}