export interface PrintableSaleItem {
  model_name: string;
  quantity: number;
  selling_price_aed: number;
  line_total_aed: number;
}

export interface PrintableSale {
  sale_id: number;
  client_name: string;
  total_quantity: number;
  total_aed: number;
  sale_date: string;
  items: PrintableSaleItem[];
}

export function printSaleInvoice(sale: PrintableSale) {
  const companyName = "Dhar Al Fakhr"; // Company name

  const itemRows = sale.items
    .map(
      (item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.model_name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${Number(item.selling_price_aed).toFixed(2)}</td>
      <td style="text-align:right">${Number(item.line_total_aed).toFixed(2)}</td>
    </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice #${sale.sale_id}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 4px 0; color: #666; }
    .info-table { width: 100%; margin-bottom: 20px; }
    .info-table td { padding: 4px 8px; }
    .info-table .label { font-weight: bold; width: 120px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px 14px; }
    .items-table th { background: #f5f5f5; text-align: left; }
    .total-row { font-weight: bold; background: #fafafa; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${companyName}</h1>
    <p>Sales Invoice</p>
  </div>

  <table class="info-table">
    <tr><td class="label">Invoice #</td><td>${sale.sale_id}</td></tr>
    <tr><td class="label">Client</td><td>${sale.client_name}</td></tr>
    <tr><td class="label">Date</td><td>${sale.sale_date}</td></tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Model</th>
        <th style="text-align:center">Quantity</th>
        <th style="text-align:right">Price/Piece (AED)</th>
        <th style="text-align:right">Total (AED)</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="total-row">
        <td colspan="2">Total</td>
        <td style="text-align:center">${sale.total_quantity}</td>
        <td></td>
        <td style="text-align:right">${Number(sale.total_aed).toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
