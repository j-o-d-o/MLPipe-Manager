import mongoose, { Schema, Document } from "mongoose";
import { User } from "models/user.model";


export interface IKey extends Document {
    public_key: string,
    private_key: string,
    name: string,
    updatedAt: mongoose.Schema.Types.Date,
    createdAt: mongoose.Schema.Types.Date,
}

const keySchema = new Schema({
    public_key: { type: String, default: null},
    private_key: { type: String, default: null, select: false},
    name: { type: String, required: true },
},
{
    timestamps: true
});

keySchema.pre<IKey>('remove', async function() {
    await User.updateMany( { keys: this._id}, { $pull: { keys: this._id}});
});


export const Key = mongoose.model<IKey>("key", keySchema);