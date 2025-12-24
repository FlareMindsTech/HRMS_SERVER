import Experience from '../Modules/ExperienceModule.js';
import User from '../Modules/UserModule.js';

//add experience
export const addExperience = async (req, res) => {
    try{
        const userExists = await User.findById(req.body.userId);
        if (!userExists) {
            return res.status(404).json({mesage: "User not found"});
        }

        const newExperience = new Experience({
            userId: req.body.userId,
            companyName: req.body.companyName,
            designation: req.body.designation,
            description: req.body.description,
            salary: req.body.salary,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            isCurrentJob: req.body.isCurrentJob,
            experience: req.body.experience
        });

        const saveExp = await newExperience.save();
        res.status(201).json({message: "Experience added successfully", data: saveExp});

    }catch(error){
        res.status(400).json({message: error.message});
    }
}

//get experience by userId
export const getExperienceByUserId = async (req,res) => {
    try{
        const expList = await Experience.find({userId: req.params.userId});

        if (expList.length === 0){
            return res.status(200).json({message: "no experience found (Freshers)", data: []})
        }

        res.status(200).json({data: expList});
    }catch(error){
        res.status(400).json({message: error.message});
    }   
}

//update experience
export const updateExperience = async (req,res) => {
    try{
        const id = req.body?.id || req.params?.id;
        if(!id){
            return res.status(400).json({message: "ID is required"});
        }
        
        const updatedExp = await Experience.findByIdAndUpdate(id, {$set: req.body}, {new: true});
        if(!updateExp){
            return res.status(404).json({message: "Experience record not found"});
        }
        res.status(200).json({message: "Updated successfully", data: updatedExp});
    }catch(error){
        res.status(400).json({message: error.message});
    }
}

//delete experience
export const deleteExperience = async (req,res) => {
  try{
    const id = req.params.id || req.body.id;
    if (!id){
        return res.status(400).json({message: "ID is required"});
    }

    const deletedExp =await Experience.findByIdAndDelete(id);
    if(!deletedExp){
        return res.status(404).json({message: "Experience record not found"});
    }
    res.status(200).json({message: "Deleted successfully"});
  }catch(error){
    res.status(400).json({message: error.message});
  }
}