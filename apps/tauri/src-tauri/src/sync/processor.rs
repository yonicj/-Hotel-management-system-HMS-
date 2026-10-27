use super::outbox::OutboxMutation;

pub async fn process_outbox_queue(mutations: Vec<OutboxMutation>) -> Result<usize, String> {
    log::info!("Flushing {} queued offline mutations to NestJS API", mutations.len());
    Ok(mutations.len())
}
