export const getFilteredClasses = (activeSection, todaysClasses) => {
  if (activeSection === "all") {
    return [...todaysClasses.english, ...todaysClasses.spanish, ...todaysClasses.polish]
      .sort((a, b) => a.sortableTime - b.sortableTime);
  }
  
  return todaysClasses[activeSection] || [];
};