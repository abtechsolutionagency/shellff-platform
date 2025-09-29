const fs = require('fs');
const path = require('path');

const walletApiFiles = [
  'app/api/wallet/transactions/route.ts',
  'app/api/wallet/deposit/route.ts',
  'app/api/wallet/withdraw/route.ts',
  'app/api/wallet/voucher/redeem/route.ts',
  'app/api/wallet/payment-methods/route.ts'
];

walletApiFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace session?.user?.id check
    content = content.replace(
      /if \(!session\?.user\?.id\) \{/g,
      'if (!session?.user?.email) {'
    );
    
    // Replace userId assignment
    content = content.replace(
      /const userId = session\.user\.id;/g,
      `// Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;`
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
});
