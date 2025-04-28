export type Event = {
    _ref: string;
    assemblyId: string;
    chapterId: string
    contentReferenceId: string
    date: Date
    hostId: string
    venueId: string
    settings: {
        invitationCode: string
        isActive: boolean
        isPrivate: boolean
        isTipAccepted: boolean
    }
    paymentMethodIds: string[]; 
    status: {
        isCheckinOpen: boolean
        isFinished: boolean
        isReservationOpen: boolean
    }
    zSpectator: SpectatorInfo[];
}

export type SpectatorInfo = { 
    createdAt: Date;
    spectatorId: string;
    numberOfCompanions: number;
    evaluationId: number;
    hasCheckin: boolean;
    hasCheckout: boolean;
    paymentId: string;
}

export type PaymentMethods = {
    paymentType: string;
    instructions: string;
    bank?: string;
    id?: string;
    name?: string;
    number?: string;
    type?: string;
    destinationAccountOwner?: string;
    provider?: string
    
}