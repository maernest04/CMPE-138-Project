// Public app limits (must match SQL column sizes in create_tables.sql)

module.exports = {
  getMaxTeamMembers() {
    return Number(process.env.MAX_TEAM_MEMBERS || 5);
  },
  /** Max string lengths for validation */
  LIMITS: {
    teamName: 100,
    studentEmail: 100,
    firstName: 50,
    lastName: 50,
    major: 50
  }
};
