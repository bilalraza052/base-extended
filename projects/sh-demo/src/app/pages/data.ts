export const OWNERS = [
  { id: 1, name: 'Bilal Raza', email: 'bilal@example.com' },
  { id: 2, name: 'Sara Khan', email: 'sara@example.com' },
  { id: 3, name: 'Ahmed Ali', email: 'ahmed@example.com' },
  { id: 4, name: 'Maria Johnson', email: 'maria@example.com' },
];

export const LIFECYCLE = [
  { id: 'subscriber', name: 'Subscriber' },
  { id: 'lead', name: 'Lead' },
  { id: 'mql', name: 'Marketing Qualified Lead' },
  { id: 'sql', name: 'Sales Qualified Lead' },
  { id: 'opportunity', name: 'Opportunity' },
  { id: 'customer', name: 'Customer' },
];

export const LEAD_STATUS = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'connected', label: 'Connected' },
  { value: 'bad_timing', label: 'Bad timing' },
];

export const CITIES = [
  { id: 1, name: 'Karachi' }, { id: 2, name: 'Lahore' }, { id: 3, name: 'Islamabad' },
  { id: 4, name: 'Almaty' }, { id: 5, name: 'Astana' }, { id: 6, name: 'Dubai' },
  { id: 7, name: 'London' }, { id: 8, name: 'Boston' }, { id: 9, name: 'Berlin' },
];

const first = ['Maria', 'Brian', 'Sara', 'Ahmed', 'Ali', 'Fatima', 'John', 'Aisha', 'Omar', 'Zara', 'Hassan', 'Lena', 'Noah', 'Emma', 'Yusuf'];
const last = ['Johnson', 'Halligan', 'Khan', 'Ali', 'Raza', 'Malik', 'Smith', 'Iqbal', 'Farooq', 'Sheikh', 'Brown', 'Novak'];
const companies = ['HubSpot', 'Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark Industries', '--'];

export function makeContacts(n: number) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const f = first[i % first.length];
    const l = last[(i * 7) % last.length];
    rows.push({
      id: i + 1,
      name: `${f} ${l}`,
      email: `${f.toLowerCase()}.${l.toLowerCase()}@example.com`,
      phone: `+1 (250) 247-${String(1500 + i * 17).padStart(4, '0')}`,
      leadStatus: LEAD_STATUS[i % LEAD_STATUS.length].value,
      lifecycle: LIFECYCLE[i % LIFECYCLE.length].id,
      ownerId: OWNERS[i % OWNERS.length].id,
      company: companies[i % companies.length],
      createdOn: new Date(2026, 9, 17 - i).toISOString(),
      subscribed: i % 3 !== 0,
      cityId: CITIES[i % CITIES.length].id,
    });
  }
  return rows;
}
