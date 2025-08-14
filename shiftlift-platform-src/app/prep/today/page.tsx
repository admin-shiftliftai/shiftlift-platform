"use client";
import { useEffect, useState } from 'react';

interface PlanItem {
  id: string;
  item_sku: string;
  item_name: string;
  plan_qty: number;
  confidence: string;
  made_qty?: number | null;
  override_qty?: number | null;
}

export default function TodayPlan() {
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      setLoading(true);
      try {
        const res = await fetch('/api/prep/plan');
        if (res.ok) {
          const data = await res.json();
          setPlan(data);
        } else {
          const text = await res.text();
          setStatus(`Error: ${text}`);
        }
      } catch (err: any) {
        setStatus(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/prep/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      if (res.ok) {
        setStatus('Plan saved successfully');
      } else {
        const text = await res.text();
        setStatus(`Error: ${text}`);
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleInputChange = (id: string, field: 'made_qty' | 'override_qty', value: number) => {
    setPlan((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const downloadCsv = () => {
    const header = ['Item SKU', 'Item Name', 'Plan Qty', 'Confidence'];
    const rows = plan.map((item) => [item.item_sku, item.item_name, item.plan_qty, item.confidence]);
    const csvContent =
      [header, ...rows]
        .map((r) => r.join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prep_plan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h1>Today's Prep Plan</h1>
      {status && <p>{status}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Plan Qty</th>
                <th>Confidence</th>
                <th>Made Qty</th>
                <th>Override Qty</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((item) => (
                <tr key={item.id}>
                  <td>{item.item_sku}</td>
                  <td>{item.item_name}</td>
                  <td>{item.plan_qty}</td>
                  <td>{item.confidence}</td>
                  <td>
                    <input
                      type="number"
                      value={item.made_qty ?? ''}
                      onChange={(e) => handleInputChange(item.id, 'made_qty', Number(e.target.value))}
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.override_qty ?? ''}
                      onChange={(e) => handleInputChange(item.id, 'override_qty', Number(e.target.value))}
                      style={{ width: '80px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem' }}>
            <button onClick={handleSave}>Save Compliance</button>
            <button onClick={downloadCsv} style={{ marginLeft: '1rem' }}>
              Export Prep Plan (CSV)
            </button>
          </div>
        </>
      )}
    </div>
  );
}