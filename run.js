


(async () => {
  
  console.log('starting')
  // const notes = await getNotes()
  const notes = await getNotesCache()
  console.log('notes: ', notes);

})()