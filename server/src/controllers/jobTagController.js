import Job from '../models/jobModel';
import Tag from '../models/tagModel';
import JobTag from '../models/jobTagModel';
import _ from 'underscore';

// Triggered from '/api/jobs/tags'
const addJobTag = (req, res) => {
  let jobId = req.body.jobId;
  let tagId = req.body.tagId;
  let foundJob;

  if (typeof jobId === 'number' && typeof tagId === 'number') {
    Job.findById(jobId)
    .then((job) => {
      if (job) {
        foundJob = job;
        return Tag.findById(tagId)
      } else {
        throw new Error(`Could not find the job with ID ${jobId}`)
      }
    })
    .then((tag) => {
      if (tag) {
        return JobTag.findOrCreate({ where: { jobId, tagId } })
      } else {
        throw new Error(`Could not find the job with ID ${tagId}`)
      }
    })
    .spread((jobTag, created) => {
      if (jobTag) {
        created ? res.status(201).send(jobTag) : res.status(200).send(jobTag);
      }
    })
    .catch((err) => {
      console.log('Error creating job tag association', err);
      res.status(500).send(err);
    });
  } else {
    res.status(500).send('Invalid id types');
  }
}

const getJobTags = (req, res) => {
  let tagIdArray = req.query.tags.split(' ');

  JobTag.findAll({
    where: { 
      tagId: { $in: tagIdArray } 
    }
  })
  .then((tags) => {
    let groupByJob = _.countBy(tags, (jobTag) => {
      return jobTag.dataValues.jobId
    });

    //map array of objects with jobId and count
    groupByJob = _.map(groupByJob, (val, key) => {
      return { 
        jobId: key,
        count: val
      }
    });
    //send relevant jobs (top 5 jobs by count);
    let relevantJobs = _.last(_.sortBy(groupByJob, 'count'), 5);
    Promise.all(_.map(relevantJobs, (item) => {
      return Job.findOne({
        where: { id: item.jobId }
      })
    }))
    .then((jobsArray) => {
      res.send(jobsArray);
    })
  })
}

export default { addJobTag, getJobTags }
