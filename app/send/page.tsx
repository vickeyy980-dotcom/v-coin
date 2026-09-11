import { requireUser } from '@/lib/auth';
import { SendForm } from '@/components/SendForm';
import { TopBar } from '@/components/ui';
export default async function SendPage(){await requireUser();return <main className="flex min-h-screen flex-col px-5 pb-5 pt-2"><TopBar title="Send" backHref="/dashboard"/><SendForm/></main>}
