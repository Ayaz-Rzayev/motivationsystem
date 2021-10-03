const express = require('express');
const router = express.Router();
//Middleware
const {isLogedIn, isAdmin, validateProject}  = require('../middleware')
// Error handling
const ExpressError = require('../ExpressError');
const catchAsync = require('../catchAsync');
// Schemas
const Project = require('../models/projects');
const User = require('../models/user');
const Rates = require('../models/rates');
const AveragePoints = require('../models/average');

//Functions
const avg = require('../functions');

router.get('/', isLogedIn, catchAsync(async(req, res, next) => {
  const currentUserId = req.session.user_id
  const currentUser = await User.find({_id: currentUserId})
  const projects = await Project.find().populate('pm')
  res.render('projects/allprojects', {projects, currentUser})
}));

router.get('/new', isLogedIn, isAdmin, async (req, res) => {
  const users = await User.find()
  res.render('projects/new', {users})
});

router.post('/', isLogedIn, isAdmin, validateProject, catchAsync(async(req, res, next) => {
  const project = new Project(req.body.project)
  await project.save()
  req.flash('success', 'Successfully created a Project')
  res.redirect('/projects')
}));

router.get('/:id/edit', isLogedIn, isAdmin, catchAsync(async(req, res, next) => {
	const {id} = req.params
  const users = await User.find()
	const project = await Project.findById(id).populate('participants').populate('pm')
	res.render('projects/edit', {project, users})
}));

router.put('/:id', isLogedIn, isAdmin, validateProject, catchAsync(async(req, res, next) => {
	const {id} = req.params
  const project = await Project.findByIdAndUpdate(id, {...req.body.project})
  await project.save()
  res.redirect('/projects')
}));

router.delete('/:id', isLogedIn, isAdmin, catchAsync(async (req, res, next) => {
	const {id} = req.params
	await Project.findByIdAndDelete(id)
  req.flash('success', 'Successfully deleted a Project')
	res.redirect('/projects')
}));

// Rate
//add logic so only participants and admin can enter
router.get('/:id/rate', isLogedIn, catchAsync(async(req, res, next) => {
	const {id} = req.params
	const project = await Project.findById(id).populate('participants').populate('pm')
	res.render('projects/rate', {project})
}));

router.post('/rate', isLogedIn, catchAsync(async(req, res, next) => {
  // insert into rateSchema
  const{project, voter, participants, criteria1, criteria2, criteria3, criteria4, criteria5, criteria6, criteria7, criteria8,criteria9, criteria10, criteria11, criteria12} = req.body

  for(let i= 0; i < participants.length; i++){
    const criteriasPlain = [criteria1[i], criteria2[i], criteria3[i], criteria4[i], criteria5[i], criteria6[i], criteria7[i], criteria8[i], criteria9[i], criteria10[i]]
    const criterias = []
    for(let j = 0; j < criteriasPlain.length; j++){
      if(criteriasPlain[j]){
        criterias.push(parseInt(criteriasPlain[j]))
      }
    }
    const average = criterias ? avg([avg(criterias), criteria11[i] ? parseInt(criteria11[i]) : 0 ]) : null
    const rate = new Rates({
      project,
      voter,
      pm,
      votes:{
        participant: participants[i],
        criteria1: criteria1[i],
        criteria2: criteria2[i],
        criteria3: criteria3[i],
        criteria4: criteria4[i],
        criteria5: criteria5[i],
        criteria6: criteria6[i],
        criteria7: criteria7[i],
        criteria8: criteria8[i],
        criteria9: criteria9[i],
        criteria10: criteria10[i],
        criteria11: criteria11[i],
        criteria12: criteria12[i],
        average: average
      }
    })
    await rate.save()
  }
  res.redirect('/projects')
}));

// Edit Rates
router.get('/:id/rate/edit', isLogedIn, catchAsync(async(req, res, next) => {
	const {id} = req.params
  const currentUser = req.session.user_id
  const currentUserString = String(currentUser)
	const project = await Project.findById(id).populate('participants').populate('pm')
  const rates = await Rates.find({project: id, voter: currentUserString}).populate('project').populate({path: 'project', populate:{path: 'pm'}}).populate('voter').populate('votes.participant').populate('votes')
	res.render('projects/editRate', {project, rates})
}));

router.put('/:id/rate/edit', isLogedIn, catchAsync(async(req, res, next) => {
  const {id} = req.params
  const currentUser = req.session.user_id
  const currentUserString = String(currentUser)
  const{project, voter, participants, criteria1, criteria2, criteria3, criteria4, criteria5, criteria6, criteria7, criteria8,criteria9, criteria10, criteria11, criteria12} = req.body
  for(let participant of participants){
    await Rates.findOneAndDelete({"votes.participant": participant, project: id, voter: currentUserString})
  }
  for(let i= 0; i < participants.length; i++){
    const criteriasPlain = [criteria1[i], criteria2[i], criteria3[i], criteria4[i], criteria5[i], criteria6[i], criteria7[i], criteria8[i], criteria9[i], criteria10[i]]
    const criterias = []
    for(let j = 0; j < criteriasPlain.length; j++){
      if(criteriasPlain[j]){
        criterias.push(parseInt(criteriasPlain[j]))
      }
    }
    const average = criterias ? avg([avg(criterias), criteria11[i] ? parseInt(criteria11[i]) : 0 ]) : null
    const rate = new Rates({
      project,
      voter,
      pm,
      votes:{
        participant: participants[i],
        criteria1: criteria1[i],
        criteria2: criteria2[i],
        criteria3: criteria3[i],
        criteria4: criteria4[i],
        criteria5: criteria5[i],
        criteria6: criteria6[i],
        criteria7: criteria7[i],
        criteria8: criteria8[i],
        criteria9: criteria9[i],
        criteria10: criteria10[i],
        criteria11: criteria11[i],
        criteria12: criteria12[i],
        average: average
      }
    })
    await rate.save()
  }
  res.redirect('/projects')
}))

router.get('/:id/rates', isLogedIn, isAdmin, catchAsync(async(req, res, next) => {
  const {id} = req.params
  const rates = await Rates.find({project: id}).populate('project').populate({path: 'project', populate:{path: 'pm'}}).populate('voter').populate('votes.participant').populate('votes')
  res.render('projects/rates', {rates, id})
}));

// Submit rates for average results
router.post('/:id/rates', isLogedIn, isAdmin, catchAsync(async(req, res, next) => {
  const {id} = req.params
  const rates = await Rates.find({project: id}).populate('project').populate({path: 'project', populate:{path: 'pm'}}).populate('voter').populate('votes.participant').populate('votes')
  let averages = await AveragePoints.find({project: id}).populate('project').populate('participant')
  let arrOfAverageId = []
  for(let rate of rates){
    if(!rate.votes.participant.equals(rate.voter)){
      if(averages.length){
        for (let average of averages){
          arrOfAverageId.push(String(average.participant._id))
        }
        if(!arrOfAverageId.includes(String(rate.votes.participant._id))){
          const averagePoint = new AveragePoints({
                project: rate.project,
                participant: rate.votes.participant,
                arrOfRates: rate.votes.average
          })
          await averagePoint.save()
          continue
        }
        for (let average of averages){
          if(String(average.participant._id) === String(rate.votes.participant._id)){
            const doc = await AveragePoints.find({participant: rate.votes.participant})
            doc[0].arrOfRates.push(rate.votes.average)
            await doc[0].save()
            continue
        }
      }
      }else{
        const averagePoint = new AveragePoints({
              project: rate.project,
              participant: rate.votes.participant,
              arrOfRates: rate.votes.average
        })
        await averagePoint.save()  
      }
      averages = await AveragePoints.find({project: id})
    }
  }
  res.redirect(`/projects/${id}/results`)
}));

router.get('/:id/results', isLogedIn, isAdmin, catchAsync(async(req, res, next) => {
  const {id} = req.params
  const project = await Project.findById(id).populate('participants').populate('pm')
  const averages = await AveragePoints.find({project: id}).populate({path: 'project', populate:{path: 'pm'}}).populate('participant')
  res.render('projects/results', {averages, project})
}));

module.exports = router;