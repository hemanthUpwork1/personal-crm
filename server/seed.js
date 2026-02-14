const db = require('./db');

// Clear existing data
db.exec('DELETE FROM reminders');
db.exec('DELETE FROM tasks');
db.exec('DELETE FROM contacts');
db.exec('DELETE FROM sqlite_sequence');

const now = new Date();
const day = (offset) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// Insert contacts
const insertContact = db.prepare(`
  INSERT INTO contacts (first_name, last_name, email, phone, company, title, notes, avatar_color, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const contacts = [
  ['Sarah', 'Chen', 'sarah.chen@techcorp.io', '(415) 555-0142', 'TechCorp', 'VP of Engineering', 'Met at React Conf 2024. Interested in our API platform. Very technical, prefers data-driven discussions.', '#0071e3', day(-30), day(-1)],
  ['Marcus', 'Johnson', 'marcus@designco.com', '(212) 555-0198', 'DesignCo', 'Head of Product Design', 'Referred by Sarah Chen. Working on a design system overhaul. Great eye for detail.', '#bf5af2', day(-25), day(-2)],
  ['Emily', 'Rodriguez', 'emily@startupxyz.com', '(650) 555-0167', 'StartupXYZ', 'Founder & CEO', 'Series A stage. Looking for technical partners. Very driven and responsive.', '#ff375f', day(-20), day(-1)],
  ['David', 'Kim', 'david.kim@bigtech.com', '(408) 555-0133', 'BigTech Inc', 'Engineering Manager', 'Manages a team of 40. Interested in developer productivity tools. Weekly 1:1 scheduled.', '#30d158', day(-18), day(-3)],
  ['Olivia', 'Thompson', 'olivia.t@mediagroup.com', '(310) 555-0155', 'MediaGroup', 'Marketing Director', 'Oversees digital marketing strategy. Interested in analytics integration.', '#ff9f0a', day(-15), day(-2)],
  ['James', 'Wilson', 'jwilson@innovatetech.io', '(617) 555-0171', 'InnovateTech', 'CTO', 'Former colleague at previous company. Building ML infrastructure. Open to advisory role.', '#5e5ce6', day(-12), day(-4)],
  ['Priya', 'Patel', 'priya.patel@dataflow.ai', '(206) 555-0188', 'DataFlow AI', 'Lead Data Scientist', 'PhD from Stanford. Working on recommendation engines. Published 3 papers this year.', '#64d2ff', day(-10), day(-1)],
  ['Alex', 'Morgan', 'alex.morgan@growthco.com', '(312) 555-0144', 'GrowthCo', 'Sales Director', 'Manages enterprise accounts. Looking to streamline CRM workflows. Golf enthusiast.', '#ff375f', day(-8), day(-5)],
];

const insertMany = db.transaction(() => {
  for (const c of contacts) {
    insertContact.run(...c);
  }
});
insertMany();

// Insert tasks (with category and sort_order)
const insertTask = db.prepare(`
  INSERT INTO tasks (contact_id, title, description, status, priority, category, sort_order, due_date, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const tasks = [
  // Work Todos
  [1, 'Follow up on API partnership proposal', 'Send revised proposal with updated pricing tiers and SLA details', 'in_progress', 'high', 'work', 0, day(2), day(-5)],
  [3, 'Prepare investor intro deck', 'Create tailored introduction deck for Emily\'s Series A investors', 'pending', 'high', 'work', 1, day(1), day(-7)],
  [4, 'Technical architecture review', 'Review David\'s microservices migration plan and provide feedback', 'in_progress', 'medium', 'work', 2, day(5), day(-4)],
  [7, 'ML model integration spec', 'Write technical spec for DataFlow\'s recommendation engine integration', 'in_progress', 'high', 'work', 3, day(6), day(-3)],
  [3, 'Due diligence document prep', 'Gather technical documentation for StartupXYZ due diligence', 'pending', 'high', 'work', 4, day(3), day(-1)],
  [5, 'Q1 marketing campaign review', 'Analyze campaign performance data and prepare recommendations', 'completed', 'medium', 'work', 5, day(-2), day(-10)],

  // People to Reach Out
  [2, 'Review design system mockups', 'Evaluate Marcus\'s new component library designs for consistency', 'pending', 'medium', 'people', 0, day(4), day(-3)],
  [6, 'Draft advisory agreement', 'Prepare advisory terms for InnovateTech board position', 'pending', 'high', 'people', 1, day(3), day(-6)],
  [1, 'Schedule product demo', 'Set up live demo of new features for TechCorp team', 'pending', 'medium', 'people', 2, day(8), day(-1)],
  [8, 'Quarterly business review prep', 'Compile Q4 metrics and growth projections for GrowthCo review', 'pending', 'low', 'people', 3, day(10), day(-2)],

  // Personal Todos
  [null, 'Update personal website', 'Refresh portfolio with recent projects and testimonials', 'pending', 'low', 'personal', 0, day(14), day(-1)],
  [null, 'Industry report research', 'Compile competitive analysis for SaaS market trends', 'pending', 'medium', 'personal', 1, day(7), day(-2)],
];

const insertTasksMany = db.transaction(() => {
  for (const t of tasks) {
    insertTask.run(...t);
  }
});
insertTasksMany();

// Insert reminders
const insertReminder = db.prepare(`
  INSERT INTO reminders (contact_id, task_id, title, description, reminder_date, is_completed)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const reminders = [
  [1, 1, 'Coffee meeting with Sarah', 'Discuss partnership next steps at Blue Bottle on Market St', day(2) , 0],
  [2, 2, 'Design review call', 'Video call to review latest design system components', day(4), 0],
  [3, 3, 'Pitch deck deadline', 'Final version of investor intro deck due to Emily', day(1), 0],
  [4, 4, 'Sprint planning with David', 'Monthly architecture sync and sprint planning session', day(7), 0],
  [5, null, 'Campaign launch check-in', 'Review Q2 campaign creative assets before launch', day(5), 0],
  [6, 6, 'Board meeting prep', 'Prepare materials for InnovateTech quarterly board meeting', day(14), 0],
  [7, 7, 'ML model demo', 'Priya presenting latest recommendation engine results', day(4), 0],
  [8, 8, 'Sales pipeline review', 'Monthly pipeline review call with Alex', day(9), 0],
  [1, null, 'Send birthday card to Sarah', 'Her birthday is coming up — send a handwritten note', day(12), 0],
  [3, null, 'Follow up on funding round', 'Check in on Series A progress after investor meetings', day(6), 0],
  [null, null, 'Renew professional memberships', 'ACM and IEEE memberships expiring soon', day(20), 0],
  [5, null, 'Marketing analytics report', 'Monthly analytics deep-dive with Olivia\'s team', day(-1), 0],
  [2, null, 'Share design resources', 'Send Marcus the UI pattern library links discussed last week', day(0), 0],
];

const insertRemindersMany = db.transaction(() => {
  for (const r of reminders) {
    insertReminder.run(...r);
  }
});
insertRemindersMany();

console.log('Database seeded successfully!');
console.log(`  ${contacts.length} contacts`);
console.log(`  ${tasks.length} tasks`);
console.log(`  ${reminders.length} reminders`);

process.exit(0);
