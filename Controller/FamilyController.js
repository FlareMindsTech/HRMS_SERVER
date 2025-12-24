import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Family from '../Modules/FamilyModule.js';


const validateAndFormatName = (name) => {
    if (!name || typeof name !== 'string') {
        throw new Error("Name is required and must be a string");
    }
    
    const trimmedName = name.trim();
    
    // capital letter
    const words = trimmedName.split(' ').filter(word => word.length > 0);
    
    for (let word of words) {
        if (word[0] !== word[0].toUpperCase()) {
            throw new Error("Name must start with capital letter. Each word in multi-word names must also start with a capital letter");
        }
    }
    
    return words.join(' ');
};

//mobile number 10 digits)
const validateMobile = (mobile) => {
    const mobileStr = String(mobile);
    if (!/^\d{10}$/.test(mobileStr)) {
        throw new Error("Mobile number must be strictly 10 digits");
    }
    return mobile;
};

// adhaar 12 digits)
const validatePAN = (pan) => {
    const panStr = String(pan);
    if (!/^\d{12}$/.test(panStr)) {
        throw new Error("PAN/Aadhaar number must be strictly 12 digits");
    }
    return pan;
};

export const createFamilyMember = async (req, res) => {
    try {
        let { userid, name, relationship, occupation, dob, adhaarNO, emergencyContact } = req.body;

        
        name = validateAndFormatName(name);
        
       
        emergencyContact = validateMobile(emergencyContact);
        
        
        adhaarNO = validatePAN(adhaarNO);

        
        const normalizedRelationship = relationship.toLowerCase().trim();

        
        const duplicateAdhaar = await Family.findOne({ userid, adhaarNO });
        if (duplicateAdhaar) {
            return res.status(400).json({ 
                message: "No duplicate data allowed", 
                warning: "Aadhaar number already exists for this user",
                duplicateFields: ['adhaarNO']
            });
        }

        //  emergencyContact
        const duplicateContact = await Family.findOne({ userid, emergencyContact });
        if (duplicateContact) {
            return res.status(400).json({ 
                message: "No duplicate data allowed", 
                warning: "Emergency contact number already exists for this user",
                duplicateFields: ['emergencyContact']
            });
        }

        //  unique relationship  
        const uniqueRelationships = ['mother', 'father', 'wife'];
        if (uniqueRelationships.includes(normalizedRelationship)) {
            const existingRelationship = await Family.findOne({ 
                userid, 
                relationship: { $regex: new RegExp(`^${normalizedRelationship}$`, 'i') }
            });
            
            if (existingRelationship) {
                return res.status(400).json({ 
                    message: "No duplicate data allowed", 
                    warning: `Only one ${normalizedRelationship} is allowed per user`,
                    duplicateFields: ['relationship']
                });
            }
        }

        const newFamilyMember = new Family({
            userid,
            name,
            relationship,
            occupation,
            dob,
            adhaarNO,
            emergencyContact
        });

        const savedMember = await newFamilyMember.save();
        res.status(201).json({ message: "Family member added successfully", data: savedMember });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getFamilyByUserId = async (req, res) => {
    try {
        const { userid } = req.params;
        const familyMembers = await Family.find({ userid });
        res.status(200).json({ data: familyMembers });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllFamilyMembers = async (req, res) => {
    try {
        const familyMembers = await Family.find().populate('userid', 'firstName lastName'); // Optional
        res.status(200).json({ data: familyMembers });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateFamilyMember = async (req, res) => {
    try {
        const { id } = req.body;

       
        const currentMember = await Family.findById(id);
        if (!currentMember) {
            return res.status(404).json({ message: "Family member not found" });
        }

       
        if (req.body.name) {
            req.body.name = validateAndFormatName(req.body.name);
        }

        //  mobile number 
        if (req.body.emergencyContact) {
            req.body.emergencyContact = validateMobile(req.body.emergencyContact);
        }

        
        if (req.body.adhaarNO) {
            req.body.adhaarNO = validatePAN(req.body.adhaarNO);
        }

   
        if (req.body.adhaarNO) {
            const duplicateAdhaar = await Family.findOne({ 
                userid: currentMember.userid, 
                adhaarNO: req.body.adhaarNO,
                _id: { $ne: id }
            });
            if (duplicateAdhaar) {
                return res.status(400).json({ 
                    message: "No duplicate data allowed", 
                    warning: "Aadhaar number already exists for this user",
                    duplicateFields: ['adhaarNO']
                });
            }
        }

        
        if (req.body.emergencyContact) {
            const duplicateContact = await Family.findOne({ 
                userid: currentMember.userid, 
                emergencyContact: req.body.emergencyContact,
                _id: { $ne: id }
            });
            if (duplicateContact) {
                return res.status(400).json({ 
                    message: "No duplicate data allowed", 
                    warning: "Emergency contact number already exists for this user",
                    duplicateFields: ['emergencyContact']
                });
            }
        }

        if (req.body.relationship) {
            const normalizedRelationship = req.body.relationship.toLowerCase().trim();
            const uniqueRelationships = ['mother', 'father', 'wife'];
            
            if (uniqueRelationships.includes(normalizedRelationship)) {
                const existingRelationship = await Family.findOne({ 
                    userid: currentMember.userid, 
                    relationship: { $regex: new RegExp(`^${normalizedRelationship}$`, 'i') },
                    _id: { $ne: id }
                });
                
                if (existingRelationship) {
                    return res.status(400).json({ 
                        message: "No duplicate data allowed", 
                        warning: `Only one ${normalizedRelationship} is allowed per user`,
                        duplicateFields: ['relationship']
                    });
                }
            }
        }

        const updatedMember = await Family.findByIdAndUpdate(id, { $set: req.body }, { new: true });
        if (!updatedMember) return res.status(404).json({ message: "Family member not found" });

        res.status(200).json({ message: "Updated successfully", data: updatedMember });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteFamilyMember = async (req, res) => {
    try {
        const { id } = req.body; // UserController uses body.email to delete, but for Family ID is safer. 
        const deletedMember = await Family.findByIdAndRemove(id);
        if (!deletedMember) return res.status(404).json({ message: "Family member not found" });

        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
