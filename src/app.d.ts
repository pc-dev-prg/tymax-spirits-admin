import type { AdminUserSession } from '#lib/types/admin.ts';

declare global {
	namespace App {
		interface Locals {
			adminUser: AdminUserSession | null;
		}
	}
}

export {};
